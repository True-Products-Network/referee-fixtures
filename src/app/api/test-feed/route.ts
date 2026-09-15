import { NextRequest, NextResponse } from 'next/server'
import { parseICS, webcalToHttps } from '@/lib/ical-parser'

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
