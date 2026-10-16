import { NextRequest, NextResponse } from 'next/server'
import { parseICS, webcalToHttps, extractTeams, extractRole, extractUserRole, parseAssignrDescription, parseArbiterDescription } from '@/lib/ical-parser'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    const httpsUrl = webcalToHttps(url)
    
    const response = await fetch(httpsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RefereeFixtureHub/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Feed returned ${response.status}` },
        { status: 502 }
      )
    }

    const icsData = await response.text()
    
    if (!icsData.includes('BEGIN:VCALENDAR')) {
      return NextResponse.json(
        { error: 'Invalid iCalendar feed' },
        { status: 502 }
      )
    }

    const fixtures = parseICS(icsData)

    return NextResponse.json({
      url: httpsUrl,
      rawPreview: icsData.slice(0, 500),
      fixturesFound: fixtures.length,
      fixtures: fixtures.slice(0, 5).map(f => {
        const teams = extractTeams(f.summary || '', f.description || '', f.location || '')
        const role = extractRole(f.summary || '', f.description || '')
        const userRole = extractUserRole(f.description || '', 'Nigel Lear')
        const assignr = parseAssignrDescription(f.description || '')
        const arbiter = parseArbiterDescription(f.description || '')
        
        return {
          uid: f.uid,
          summary: f.summary,
          description: f.description?.slice(0, 200),
          descriptionRaw: f.description,
          start: f.start.toISOString(),
          end: f.end.toISOString(),
          location: f.location,
          parsed: {
            homeTeam: teams.homeTeam,
            awayTeam: teams.awayTeam,
            role,
            userRole,
            assignrDetails: assignr,
            arbiterDetails: arbiter,
          }
        }
      }),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
