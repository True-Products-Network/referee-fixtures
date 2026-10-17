import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseICS, webcalToHttps, extractTeams, extractRole, extractUserRole, extractCompetition, cleanLocation, parseAssignrDescription, parseArbiterDescription } from '@/lib/ical-parser'
import type { SourceConnection } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's full name from profile for role detection
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const userFullName = userProfile?.full_name || user.user_metadata?.full_name || ''

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
    const errors: string[] = []
    let successCount = 0

    // Fetch arrival rules for this user
    const { data: arrivalRules } = await supabase
      .from('arrival_rules')
      .select('*')
      .eq('tenant_id', source.tenant_id)
      .order('arrival_lead_minutes', { ascending: false })

    // Fetch rate cards for fee auto-assignment
    const { data: rateCards } = await supabase
      .from('rate_cards')
      .select('*')
      .eq('tenant_id', source.tenant_id)
      .eq('is_active', true)

    // Default arrival rule
    const defaultRule = {
      arrival_lead_minutes: 45,
      parking_buffer_minutes: 15,
      match_duration_minutes: 90,
      post_match_buffer_minutes: 15,
    }

    // Helper to find matching arrival rule
    function findArrivalRule(competition?: string | null, role?: string | null) {
      if (!arrivalRules || arrivalRules.length === 0) return defaultRule
      
      // Try to find exact match
      const match = (arrivalRules as any[]).find((r: any) => {
        const compMatch = !r.competition_type || !competition || 
          competition.toLowerCase().includes(r.competition_type.toLowerCase())
        const roleMatch = !r.role || !role || r.role === role
        return compMatch && roleMatch
      })
      
      return match || defaultRule
    }

    // Store raw source records
    for (const fixture of fixtures) {
      const { error: sourceRecordError } = await supabase
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

      if (sourceRecordError) {
        console.error('Source record upsert error:', sourceRecordError)
        errors.push(`Source record ${fixture.uid}: ${sourceRecordError.message}`)
      }

      // Extract teams, role, competition from the fixture data
      const { homeTeam, awayTeam } = extractTeams(fixture.summary || '', fixture.description || '', fixture.location || '')
      
      // Try to extract user's specific role first, fallback to generic extraction
      let role = extractUserRole(fixture.description || '', userFullName)
      if (role === 'referee' && userFullName) {
        // If extractUserRole returned default, try the generic one
        role = extractRole(fixture.summary || '', fixture.description || '')
      }
      
      const competition = extractCompetition(fixture.summary || '')
      const location = cleanLocation(fixture.location || '')

      // Parse source-specific details from description
      const assignrDetails = parseAssignrDescription(fixture.description || '')
      const arbiterDetails = parseArbiterDescription(fixture.description || '')

      // Build crew list from officials
      const crewNames: string[] = []
      
      // Assignr officials
      if (assignrDetails.referee) crewNames.push(assignrDetails.referee)
      if (assignrDetails.ar1 && assignrDetails.ar1 !== 'unassigned') crewNames.push(assignrDetails.ar1)
      if (assignrDetails.ar2 && assignrDetails.ar2 !== 'unassigned') crewNames.push(assignrDetails.ar2)
      if (assignrDetails.fourthOfficial && assignrDetails.fourthOfficial !== 'unassigned') crewNames.push(assignrDetails.fourthOfficial)
      
      // Arbiter officials
      for (const official of arbiterDetails.officials) {
        const name = `${official.name} (${official.position})`
        if (!crewNames.includes(name)) {
          crewNames.push(name)
        }
      }

      // Determine source organisation
      let sourceOrganisation = assignrDetails.organisation
      if (!sourceOrganisation && arbiterDetails.event) {
        sourceOrganisation = 'ArbiterSports'
      }

      // Determine source URL
      let sourceUrl = assignrDetails.url
      if (!sourceUrl && arbiterDetails.url) {
        sourceUrl = arbiterDetails.url
      }

      // Ensure we have valid team names (required fields)
      const finalHomeTeam = homeTeam?.trim() || 'TBD'
      const finalAwayTeam = awayTeam?.trim() || 'TBD'

      // Find matching arrival rule
      const arrivalRule = findArrivalRule(competition, role)

      // Find matching rate card for fee auto-assignment
      // Uses EXACT match on competition_type so "MLS Next U13" != "MLS Next U14"
      let expectedFee: number | null = null
      if (rateCards && rateCards.length > 0 && competition && role) {
        const normalizedComp = competition.trim().toLowerCase()
        const normalizedRole = role.trim().toLowerCase()
        
        const matchingRate = (rateCards as any[]).find((r: any) => {
          const rateComp = (r.competition_type || '').trim().toLowerCase()
          const rateRole = (r.role || '').trim().toLowerCase()
          return rateComp === normalizedComp && rateRole === normalizedRole
        })
        
        if (matchingRate) {
          expectedFee = matchingRate.fee_amount
        }
      }
      
      // Calculate times based on arrival rule
      const kickoffDate = new Date(fixture.start.toISOString())
      const arrivalLeadMs = (arrivalRule.arrival_lead_minutes || 45) * 60 * 1000
      const parkingBufferMs = (arrivalRule.parking_buffer_minutes || 15) * 60 * 1000
      const postMatchBufferMs = (arrivalRule.post_match_buffer_minutes || 15) * 60 * 1000
      
      const requiredArrivalTime = new Date(kickoffDate.getTime() - arrivalLeadMs)
      const plannedDepartureTime = new Date(kickoffDate.getTime() - arrivalLeadMs - parkingBufferMs)
      const expectedMatchEnd = new Date(fixture.end.toISOString())
      const postMatchEnd = new Date(expectedMatchEnd.getTime() + postMatchBufferMs)

      const fixtureData = {
        tenant_id: source.tenant_id,
        user_id: user.id,
        source_name: source.name,
        source_organisation: sourceOrganisation || null,
        source_record_id: fixture.uid,
        source_uid: fixture.uid,
        source_url: sourceUrl || null,
        import_method: 'ical_feed',
        sport: 'soccer',
        competition,
        home_team: finalHomeTeam,
        away_team: finalAwayTeam,
        appointment_status: 'confirmed' as const,
        role,
        crew_names: crewNames.length > 0 ? crewNames : null,
        timezone: 'America/Chicago',
        kickoff_start: fixture.start.toISOString(),
        expected_match_end: postMatchEnd.toISOString(),
        required_arrival_time: requiredArrivalTime.toISOString(),
        planned_departure_time: plannedDepartureTime.toISOString(),
        venue_name: location || null,
        expected_gross_amount: expectedFee,
        payment_status: 'expected',
        pre_match_buffer_minutes: arrivalRule.arrival_lead_minutes || 45,
        post_match_buffer_minutes: arrivalRule.post_match_buffer_minutes || 15,
      }

      const { error: fixtureError } = await supabase
        .from('fixtures')
        .upsert(fixtureData, {
          onConflict: 'source_record_id'
        })

      if (fixtureError) {
        console.error('Fixture upsert error:', fixtureError, 'Data:', fixtureData)
        errors.push(`Fixture ${fixture.uid}: ${fixtureError.message}`)
      } else {
        successCount++
      }
    }

    // Update source connection
    await supabase
      .from('source_connections')
      .update({
        status: errors.length > 0 && successCount === 0 ? 'error' : 'active',
        last_successful_check: new Date().toISOString(),
        next_planned_check: new Date(Date.now() + (source.refresh_interval_minutes || 60) * 60 * 1000).toISOString(),
        imported_record_count: successCount,
        error_count: errors.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sourceId)

    return NextResponse.json({
      fixturesFound: fixtures.length,
      fixturesImported: successCount,
      errors: errors.length > 0 ? errors : undefined,
      fixtures: fixtures.slice(0, 5).map(f => ({
        uid: f.uid,
        summary: f.summary,
        description: f.description?.slice(0, 100),
        start: f.start.toISOString(),
        end: f.end.toISOString(),
        location: f.location,
      })),
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
