import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

// Minimum gap between fixtures in minutes
const MIN_GAP_MINUTES = 30
// Default match duration if not specified
const DEFAULT_MATCH_DURATION = 90
// Default travel time estimate in minutes
const DEFAULT_TRAVEL_TIME = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CheckRequest = await request.json()
    const { date, kickoff, duration, arrivalLead, venue, role, fee } = body

    // Build the proposed fixture time window
    const proposedStart = parseISO(`${date}T${kickoff}`)
    const matchDuration = duration || DEFAULT_MATCH_DURATION
    const proposedEnd = addMinutes(proposedStart, matchDuration)
    const arrivalTime = addMinutes(proposedStart, -(arrivalLead || 45))
    const departureTime = addMinutes(proposedEnd, 15) // post-match buffer

    // Fetch existing fixtures for this date +/- 1 day to catch overlaps
    const checkStart = addMinutes(arrivalTime, -180) // 3 hours before arrival
    const checkEnd = addMinutes(departureTime, 180) // 3 hours after departure

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

    // Check for conflicts
    let status: 'available' | 'tight' | 'unavailable' = 'available'
    let reason = 'No conflicts found. You are clear for this fixture.'
    let beforeFixture: { time: string; venue: string; travelTime: number } | undefined
    let afterFixture: { time: string; venue: string; travelTime: number } | undefined

    for (const fixture of activeFixtures) {
      const fixtureStart = parseISO(fixture.kickoff_start)
      const fixtureEnd = fixture.expected_match_end
        ? parseISO(fixture.expected_match_end)
        : addMinutes(fixtureStart, DEFAULT_MATCH_DURATION)

      // Add buffers
      const fixtureArrival = addMinutes(fixtureStart, -(fixture.pre_match_buffer_minutes || 45))
      const fixtureDeparture = addMinutes(fixtureEnd, (fixture.post_match_buffer_minutes || 15))

      // Check if proposed fixture overlaps with existing
      const proposedWindowStart = arrivalTime
      const proposedWindowEnd = departureTime

      // Check overlap
      const overlaps = (
        (proposedWindowStart >= fixtureArrival && proposedWindowStart < fixtureDeparture) ||
        (proposedWindowEnd > fixtureArrival && proposedWindowEnd <= fixtureDeparture) ||
        (proposedWindowStart <= fixtureArrival && proposedWindowEnd >= fixtureDeparture)
      )

      if (overlaps) {
        status = 'unavailable'
        reason = `Conflict: You have ${fixture.home_team} v ${fixture.away_team} at ${format(fixtureStart, 'h:mm a')} (${fixture.appointment_status})`
        break
      }

      // Check gap before proposed fixture
      const gapBefore = differenceInMinutes(proposedWindowStart, fixtureDeparture)
      if (gapBefore >= 0 && gapBefore < MIN_GAP_MINUTES) {
        status = 'tight'
        reason = `Tight turnaround: Only ${gapBefore} minutes after ${fixture.home_team} v ${fixture.away_team} (${format(fixtureStart, 'h:mm a')})`
        beforeFixture = {
          time: format(fixtureStart, 'h:mm a'),
          venue: fixture.venue_name || 'Unknown venue',
          travelTime: fixture.travel_time_after_minutes || DEFAULT_TRAVEL_TIME,
        }
      }

      // Check gap after proposed fixture
      const gapAfter = differenceInMinutes(fixtureArrival, proposedWindowEnd)
      if (gapAfter >= 0 && gapAfter < MIN_GAP_MINUTES) {
        if (status === 'available') {
          status = 'tight'
          reason = `Tight turnaround: Only ${gapAfter} minutes before ${fixture.home_team} v ${fixture.away_team} (${format(fixtureStart, 'h:mm a')})`
        }
        afterFixture = {
          time: format(fixtureStart, 'h:mm a'),
          venue: fixture.venue_name || 'Unknown venue',
          travelTime: fixture.travel_time_before_minutes || DEFAULT_TRAVEL_TIME,
        }
      }
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

    return NextResponse.json({
      status,
      reason,
      beforeFixture,
      afterFixture,
      totalCommitment,
      expectedHourly,
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
