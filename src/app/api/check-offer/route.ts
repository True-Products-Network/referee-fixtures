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
const MIN_GAP_MINUTES = 15 // Minimum buffer between fixtures

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's home address for travel calculations
    const { data: userData } = await supabase
      .from('users')
      .select('home_address')
      .eq('id', user.id)
      .single()

    const homeAddress = (userData as any)?.home_address

    const body: CheckRequest = await request.json()
    const { date, kickoff, duration, arrivalLead, venue, role, fee } = body

    // Build the proposed fixture time window
    const proposedStart = parseISO(`${date}T${kickoff}`)
    const matchDuration = duration || DEFAULT_MATCH_DURATION
    const proposedEnd = addMinutes(proposedStart, matchDuration)

    // Calculate travel time from home to venue
    let travelToVenue = getDefaultTravelTime()
    if (homeAddress && venue) {
      const travelResult = await calculateTravelWithCache(homeAddress, venue)
      if (travelResult) {
        travelToVenue = travelResult.durationMinutes
      }
    }

    const arrivalTime = addMinutes(proposedStart, -(arrivalLead || 45))
    const departureTime = addMinutes(proposedEnd, 15) // post-match buffer

    // Fetch existing fixtures for this date +/- 1 day
    const checkStart = addMinutes(arrivalTime, -240) // 4 hours before arrival
    const checkEnd = addMinutes(departureTime, 240) // 4 hours after departure

    const { data: existingFixtures, error } = await supabase
      .from('fixtures')
      .select('id, kickoff_start, expected_match_end, venue_name, home_team, away_team, appointment_status, pre_match_buffer_minutes, post_match_buffer_minutes, travel_time_before_minutes, travel_time_after_minutes')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .gte('kickoff_start', checkStart.toISOString())
      .lte('kickoff_start', checkEnd.toISOString())
      .order('kickoff_start', { ascending: true }) as { data: FixtureCheck[] | null; error: Error | null }

    if (error) throw error

    const fixtures = existingFixtures || []

    // Filter out cancelled/declined fixtures
    const activeFixtures = fixtures.filter(f =>
      f.appointment_status !== 'cancelled' &&
      f.appointment_status !== 'declined'
    )

    // Check for conflicts with real travel times
    let status: 'available' | 'tight' | 'unavailable' = 'available'
    let reason = 'No conflicts found. You are clear for this fixture.'
    let beforeFixture: { time: string; venue: string; travelTime: number; distanceMiles: number | null } | undefined
    let afterFixture: { time: string; venue: string; travelTime: number; distanceMiles: number | null } | undefined
    let smallestGapBefore = Infinity
    let smallestGapAfter = Infinity

    for (const fixture of activeFixtures) {
      const fixtureStart = parseISO(fixture.kickoff_start)
      const fixtureEnd = fixture.expected_match_end
        ? parseISO(fixture.expected_match_end)
        : addMinutes(fixtureStart, DEFAULT_MATCH_DURATION)

      // Add buffers
      const fixtureArrival = addMinutes(fixtureStart, -(fixture.pre_match_buffer_minutes || 45))
      const fixtureDeparture = addMinutes(fixtureEnd, (fixture.post_match_buffer_minutes || 15))

      // Calculate real travel time between venues if both have addresses
      let travelBetweenFixtures = getDefaultTravelTime()
      let distanceBetween: number | null = null

      if (venue && fixture.venue_name) {
        const travelResult = await calculateTravelWithCache(fixture.venue_name, venue)
        if (travelResult) {
          travelBetweenFixtures = travelResult.durationMinutes
          distanceBetween = travelResult.distanceMiles
        }
      }

      // Check if proposed fixture overlaps with existing
      const proposedWindowStart = arrivalTime
      const proposedWindowEnd = departureTime

      const overlaps = (
        (proposedWindowStart >= fixtureArrival && proposedWindowStart < fixtureDeparture) ||
        (proposedWindowEnd > fixtureArrival && proposedWindowEnd <= fixtureDeparture) ||
        (proposedWindowStart <= fixtureArrival && proposedWindowEnd >= fixtureDeparture)
      )

      if (overlaps) {
        status = 'unavailable'
        reason = `Conflict: You have ${fixture.home_team} v ${fixture.away_team} at ${format(fixtureStart, 'h:mm a')} (${fixture.appointment_status})`
        // Set beforeFixture to the conflicting fixture for context
        beforeFixture = {
          time: format(fixtureStart, 'h:mm a'),
          venue: fixture.venue_name || 'Unknown venue',
          travelTime: travelBetweenFixtures,
          distanceMiles: distanceBetween,
        }
        break
      }

      // Check gap before proposed fixture (existing → proposed)
      // Need time to travel from existing venue to proposed venue
      const requiredGapBefore = travelBetweenFixtures + MIN_GAP_MINUTES
      const gapBefore = differenceInMinutes(proposedWindowStart, fixtureDeparture)

      if (gapBefore >= 0 && gapBefore < smallestGapBefore) {
        smallestGapBefore = gapBefore
        beforeFixture = {
          time: format(fixtureStart, 'h:mm a'),
          venue: fixture.venue_name || 'Unknown venue',
          travelTime: travelBetweenFixtures,
          distanceMiles: distanceBetween,
        }
        if (gapBefore < requiredGapBefore) {
          status = 'tight'
          reason = `Tight: Only ${gapBefore} min gap (need ${requiredGapBefore} min including ${travelBetweenFixtures} min travel) after ${fixture.home_team} v ${fixture.away_team}`
        }
      }

      // Check gap after proposed fixture (proposed → existing)
      const requiredGapAfter = travelBetweenFixtures + MIN_GAP_MINUTES
      const gapAfter = differenceInMinutes(fixtureArrival, proposedWindowEnd)

      if (gapAfter >= 0 && gapAfter < smallestGapAfter) {
        smallestGapAfter = gapAfter
        afterFixture = {
          time: format(fixtureStart, 'h:mm a'),
          venue: fixture.venue_name || 'Unknown venue',
          travelTime: travelBetweenFixtures,
          distanceMiles: distanceBetween,
        }
        if (gapAfter < requiredGapAfter && status === 'available') {
          status = 'tight'
          reason = `Tight: Only ${gapAfter} min gap (need ${requiredGapAfter} min including ${travelBetweenFixtures} min travel) before ${fixture.home_team} v ${fixture.away_team}`
        }
      }
    }

    // If no tight gaps found, clear the before/after fixtures
    if (status === 'available') {
      beforeFixture = undefined
      afterFixture = undefined
    }

    // Calculate total commitment
    const totalMinutes = differenceInMinutes(departureTime, arrivalTime)
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    const totalCommitment = hours > 0
      ? `${hours} hour${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`
      : `${mins} minutes`

    // Calculate expected hourly
    const expectedHourly = fee && totalMinutes > 0
      ? fee / (totalMinutes / 60)
      : 0

    // Calculate mileage if we have home address and venue
    let mileage: number | null = null
    if (homeAddress && venue) {
      const homeToVenue = await calculateTravelWithCache(homeAddress, venue)
      if (homeToVenue) {
        mileage = homeToVenue.distanceMiles
      }
    }

    return NextResponse.json({
      status,
      reason,
      beforeFixture,
      afterFixture,
      totalCommitment,
      expectedHourly,
      travelToVenue,
      mileage,
      proposed: {
        arrivalTime: arrivalTime.toISOString(),
        kickoff: proposedStart.toISOString(),
        departureTime: departureTime.toISOString(),
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
