import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTravelWithCache, getDefaultTravelTime } from '@/lib/travel'
import { addMinutes, differenceInMinutes, parseISO, format } from 'date-fns'

interface CheckRequest {
  date: string
  kickoff: string
  duration: number
  arrivalLead: number
  venue: string
  role: string
  fee: number | null
}

interface FixtureCheck {
  id: string
  kickoff_start: string
  expected_match_end: string | null
  venue_name: string | null
  home_team: string
  away_team: string
  appointment_status: string
  pre_match_buffer_minutes: number
  post_match_buffer_minutes: number
  travel_time_before_minutes: number | null
  travel_time_after_minutes: number | null
}

const DEFAULT_MATCH_DURATION = 90
const MIN_GAP_MINUTES = 15

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('home_address')
      .eq('id', user.id)
      .single()

    const homeAddress = (userData as any)?.home_address

    const body: CheckRequest = await request.json()
    const { date, kickoff, duration, arrivalLead, venue, role, fee } = body

    // Build proposed fixture timeline
    const proposedStart = parseISO(`${date}T${kickoff}`)
    const matchDuration = duration || DEFAULT_MATCH_DURATION
    const proposedEnd = addMinutes(proposedStart, matchDuration)
    const proposedArrival = addMinutes(proposedStart, -(arrivalLead || 45))
    const proposedDeparture = addMinutes(proposedEnd, 15)

    // Travel from home to proposed venue
    let travelToVenue = getDefaultTravelTime()
    if (homeAddress && venue) {
      const result = await calculateTravelWithCache(homeAddress, venue)
      if (result) travelToVenue = result.durationMinutes
    }

    // Fetch existing fixtures for this date
    const checkStart = addMinutes(proposedArrival, -240)
    const checkEnd = addMinutes(proposedDeparture, 240)

    const { data: existingFixtures, error } = await supabase
      .from('fixtures')
      .select('id, kickoff_start, expected_match_end, venue_name, home_team, away_team, appointment_status, pre_match_buffer_minutes, post_match_buffer_minutes, travel_time_before_minutes, travel_time_after_minutes')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .gte('kickoff_start', checkStart.toISOString())
      .lte('kickoff_start', checkEnd.toISOString())
      .order('kickoff_start', { ascending: true }) as { data: FixtureCheck[] | null; error: Error | null }

    if (error) throw error

    const activeFixtures = (existingFixtures || []).filter(f =>
      f.appointment_status !== 'cancelled' &&
      f.appointment_status !== 'declined'
    )

    let status: 'available' | 'tight' | 'unavailable' = 'available'
    let reason = 'No conflicts found. You are clear for this fixture.'
    let conflictFixture: { time: string; venue: string; travelTime: number; distanceMiles: number | null } | undefined
    let beforeFixture: { time: string; venue: string; travelTime: number; distanceMiles: number | null } | undefined
    let afterFixture: { time: string; venue: string; travelTime: number; distanceMiles: number | null } | undefined

    for (const fixture of activeFixtures) {
      const fixtureStart = parseISO(fixture.kickoff_start)
      const fixtureEnd = fixture.expected_match_end
        ? parseISO(fixture.expected_match_end)
        : addMinutes(fixtureStart, DEFAULT_MATCH_DURATION)

      const fixtureArrival = addMinutes(fixtureStart, -(fixture.pre_match_buffer_minutes || 45))
      const fixtureDeparture = addMinutes(fixtureEnd, (fixture.post_match_buffer_minutes || 15))

      // Travel between venues
      let travelBetween = getDefaultTravelTime()
      let distanceBetween: number | null = null
      if (venue && fixture.venue_name) {
        const result = await calculateTravelWithCache(fixture.venue_name, venue)
        if (result) {
          travelBetween = result.durationMinutes
          distanceBetween = result.distanceMiles
        }
      }

      const fixtureInfo = {
        time: format(fixtureStart, 'h:mm a'),
        venue: fixture.venue_name || 'Unknown venue',
        travelTime: travelBetween,
        distanceMiles: distanceBetween,
      }

      // OVERLAP CHECK: Does proposed fixture overlap with existing?
      const proposedOverlapsExisting = proposedArrival < fixtureDeparture && proposedDeparture > fixtureArrival

      if (proposedOverlapsExisting) {
        status = 'unavailable'
        reason = `Conflict: You have ${fixture.home_team} v ${fixture.away_team} at ${fixtureInfo.time} (${fixture.appointment_status})`
        conflictFixture = fixtureInfo
        break
      }

      // Existing fixture is BEFORE proposed (ends before proposed starts)
      if (fixtureDeparture <= proposedArrival) {
        const gap = differenceInMinutes(proposedArrival, fixtureDeparture)
        const requiredGap = travelBetween + MIN_GAP_MINUTES

        if (!beforeFixture || gap < differenceInMinutes(proposedArrival, parseISO(beforeFixture.time))) {
          beforeFixture = fixtureInfo
        }

        if (gap < requiredGap) {
          status = 'tight'
          reason = `Tight: Only ${gap} min after ${fixture.home_team} v ${fixture.away_team} at ${fixtureInfo.time} (need ${requiredGap} min including ${travelBetween} min travel)`
        }
      }

      // Existing fixture is AFTER proposed (starts after proposed ends)
      if (fixtureArrival >= proposedDeparture) {
        const gap = differenceInMinutes(fixtureArrival, proposedDeparture)
        const requiredGap = travelBetween + MIN_GAP_MINUTES

        if (!afterFixture || gap < differenceInMinutes(parseISO(afterFixture.time), proposedDeparture)) {
          afterFixture = fixtureInfo
        }

        if (gap < requiredGap && status === 'available') {
          status = 'tight'
          reason = `Tight: Only ${gap} min before ${fixture.home_team} v ${fixture.away_team} at ${fixtureInfo.time} (need ${requiredGap} min including ${travelBetween} min travel)`
        }
      }
    }

    // If available, don't show before/after (they're just context, not problems)
    if (status === 'available') {
      beforeFixture = undefined
      afterFixture = undefined
    }

    // Calculate total commitment
    const totalMinutes = differenceInMinutes(proposedDeparture, proposedArrival)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    const totalCommitment = hours > 0
      ? `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`
      : `${mins} minutes`

    const expectedHourly = fee && totalMinutes > 0 ? fee / (totalMinutes / 60) : 0

    let mileage: number | null = null
    if (homeAddress && venue) {
      const result = await calculateTravelWithCache(homeAddress, venue)
      if (result) mileage = result.distanceMiles
    }

    return NextResponse.json({
      status,
      reason,
      conflictFixture,
      beforeFixture,
      afterFixture,
      totalCommitment,
      expectedHourly,
      travelToVenue,
      mileage,
      proposed: {
        arrivalTime: proposedArrival.toISOString(),
        kickoff: proposedStart.toISOString(),
        departureTime: proposedDeparture.toISOString(),
      },
      existingFixtures: activeFixtures.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
