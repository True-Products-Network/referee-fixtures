import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseICS, webcalToHttps } from '@/lib/ical-parser'
import type { SourceConnection } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sourceId } = await request.json()

    // Get source connection
    const { data: source, error: srcError } = await supabase
      .from('source_connections')
      .select('*')
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single() as { data: SourceConnection | null; error: Error | null }

    if (srcError || !source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    if (!source.feed_url_encrypted) {
      return NextResponse.json({ error: 'No feed URL configured' }, { status: 400 })
    }

    // Fetch feed
    const url = webcalToHttps(source.feed_url_encrypted)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RefereeFixtureHub/1.0)',
      },
    })

    if (!response.ok) {
      await supabase
        .from('source_connections')
        .update({
          status: 'error',
          error_count: source.error_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sourceId)

      return NextResponse.json(
        { error: `Feed returned ${response.status}` },
        { status: 502 }
      )
    }

    const icsData = await response.text()

    if (!icsData.includes('BEGIN:VCALENDAR')) {
      await supabase
        .from('source_connections')
        .update({
          status: 'error',
          error_count: source.error_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sourceId)

      return NextResponse.json(
        { error: 'Invalid iCalendar feed' },
        { status: 502 }
      )
    }

    const fixtures = parseICS(icsData)

    // Store raw source records
    for (const fixture of fixtures) {
      await supabase
        .from('source_records')
        .upsert({
          tenant_id: source.tenant_id,
          source_connection_id: source.id,
          source_record_id: fixture.uid,
          source_uid: fixture.uid,
          raw_payload: {
            summary: fixture.summary,
            description: fixture.description,
            location: fixture.location,
            start: fixture.start.toISOString(),
            end: fixture.end.toISOString(),
            status: fixture.status,
          },
          import_method: 'ical_feed',
          is_processed: false,
        }, {
          onConflict: 'source_connection_id,source_record_id'
        })

      // Also create/update the fixture record
      // Parse summary to extract teams: "Team A vs Team B" or "Team A v Team B"
      const summary = fixture.summary || ''
      let homeTeam = summary
      let awayTeam = ''
      
      const vsMatch = summary.match(/^(.+?)\s+(?:vs?|VS?|Vs)\s+(.+)$/i)
      if (vsMatch) {
        homeTeam = vsMatch[1].trim()
        awayTeam = vsMatch[2].trim()
      }

      await supabase
        .from('fixtures')
        .upsert({
          tenant_id: source.tenant_id,
          user_id: user.id,
          source_name: source.name,
          source_record_id: fixture.uid,
          source_uid: fixture.uid,
          import_method: 'ical_feed',
          sport: 'soccer',
          home_team: homeTeam,
          away_team: awayTeam,
          appointment_status: 'confirmed',
          role: 'referee',
          timezone: 'America/Chicago',
          kickoff_start: fixture.start.toISOString(),
          expected_match_end: fixture.end.toISOString(),
          venue_id: fixture.location || null,
          payment_status: 'expected',
          pre_match_buffer_minutes: 0,
          post_match_buffer_minutes: 15,
        }, {
          onConflict: 'source_record_id'
        })
    }

    // Update source connection
    await supabase
      .from('source_connections')
      .update({
        status: 'active',
        last_successful_check: new Date().toISOString(),
        next_planned_check: new Date(Date.now() + (source.refresh_interval_minutes || 60) * 60 * 1000).toISOString(),
        imported_record_count: fixtures.length,
        error_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId)

    return NextResponse.json({
      fixturesFound: fixtures.length,
      fixtures: fixtures.slice(0, 5).map(f => ({
        uid: f.uid,
        summary: f.summary,
        start: f.start.toISOString(),
        end: f.end.toISOString(),
        location: f.location,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
