import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createEvent, updateEvent, deleteEvent } from '@/lib/google-calendar'
import { addMinutes, parseISO } from 'date-fns'

interface Fixture {
  id: string
  home_team: string
  away_team: string
  kickoff_start: string
  expected_match_end: string | null
  venue_name: string | null
  role: string
  appointment_status: string
  google_calendar_event_id: string | null
  expected_gross_amount: number | null
  competition: string | null
  age_group: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's Google Calendar tokens using raw select
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError || !(userData as any)?.google_calendar_access_token) {
      return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 })
    }

    const tokens = {
      access_token: (userData as any).google_calendar_access_token,
      refresh_token: (userData as any).google_calendar_refresh_token,
      expiry_date: (userData as any).google_calendar_token_expiry,
    }

    // Get fixtures that need syncing
    const { searchParams } = new URL(request.url)
    const fixtureId = searchParams.get('fixtureId')

    let query = supabase
      .from('fixtures')
      .select('id, home_team, away_team, kickoff_start, expected_match_end, venue_name, role, appointment_status, google_calendar_event_id, expected_gross_amount, competition, age_group')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .in('appointment_status', ['offered', 'accepted', 'confirmed', 'change_pending'])

    if (fixtureId) {
      query = query.eq('id', fixtureId)
    }

    const { data: fixtures, error: fixturesError } = await query as { data: Fixture[] | null; error: any }

    if (fixturesError) throw fixturesError

    const results = []

    for (const fixture of fixtures || []) {
      try {
        const startTime = fixture.kickoff_start
        const endTime = fixture.expected_match_end || addMinutes(parseISO(fixture.kickoff_start), 105).toISOString()

        const eventSummary = `${fixture.home_team} v ${fixture.away_team}`
        const eventDescription = [
          fixture.competition && `Competition: ${fixture.competition}`,
          fixture.age_group && `Age Group: ${fixture.age_group}`,
          fixture.role && `Role: ${fixture.role}`,
          fixture.expected_gross_amount && `Fee: $${fixture.expected_gross_amount.toFixed(2)}`,
          `Status: ${fixture.appointment_status}`,
        ].filter(Boolean).join('\n')

        const event = {
          summary: eventSummary,
          description: eventDescription,
          location: fixture.venue_name || undefined,
          start: {
            dateTime: startTime,
            timeZone: 'America/Chicago',
          },
          end: {
            dateTime: endTime,
            timeZone: 'America/Chicago',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 1440 }, // 1 day before
              { method: 'popup', minutes: 120 },  // 2 hours before
            ],
          },
        }

        let eventId = fixture.google_calendar_event_id

        if (eventId) {
          // Update existing event
          await updateEvent(tokens, 'primary', eventId, event)
          results.push({ fixtureId: fixture.id, action: 'updated', eventId })
        } else {
          // Create new event
          const response = await createEvent(tokens, 'primary', event)
          eventId = response.id || null
          results.push({ fixtureId: fixture.id, action: 'created', eventId })
        }

        // Update fixture with event ID
        if (eventId) {
          await supabase.from('fixtures').update({
            google_calendar_event_id: eventId,
            updated_at: new Date().toISOString(),
          } as any).eq('id', fixture.id)
        }
      } catch (err) {
        console.error(`Failed to sync fixture ${fixture.id}:`, err)
        results.push({ fixtureId: fixture.id, action: 'failed', error: (err as Error).message })
      }
    }

    return NextResponse.json({
      synced: results.length,
      results,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fixtureId = searchParams.get('fixtureId')

    if (!fixtureId) {
      return NextResponse.json({ error: 'Fixture ID required' }, { status: 400 })
    }

    // Get user's tokens and fixture
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: fixture } = await supabase
      .from('fixtures')
      .select('google_calendar_event_id')
      .eq('id', fixtureId)
      .eq('user_id', user.id)
      .single()

    if (!fixture?.google_calendar_event_id) {
      return NextResponse.json({ error: 'No calendar event found' }, { status: 404 })
    }

    const tokens = {
      access_token: (userData as any).google_calendar_access_token,
      refresh_token: (userData as any).google_calendar_refresh_token,
    }

    await deleteEvent(tokens, 'primary', fixture.google_calendar_event_id)

    // Clear event ID from fixture
    await supabase.from('fixtures').update({
      google_calendar_event_id: null,
      updated_at: new Date().toISOString(),
    } as any).eq('id', fixtureId)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
