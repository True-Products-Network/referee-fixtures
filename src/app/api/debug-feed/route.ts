import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    const httpsUrl = url.replace(/^webcal:\/\//, 'https://')
    
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
    
    // Find first VEVENT and extract raw data
    const eventStart = icsData.indexOf('BEGIN:VEVENT')
    const eventEnd = icsData.indexOf('END:VEVENT', eventStart)
    const firstEvent = icsData.slice(eventStart, eventEnd + 10)
    
    // Extract key fields
    const uidMatch = firstEvent.match(/UID:(.+)/)
    const summaryMatch = firstEvent.match(/SUMMARY:(.+)/)
    const descMatch = firstEvent.match(/DESCRIPTION:([\s\S]+?)(?=\n[A-Z-]+:)/)
    const dtstartMatch = firstEvent.match(/DTSTART[^:]*:(.+)/)
    const dtendMatch = firstEvent.match(/DTEND[^:]*:(.+)/)
    const locationMatch = firstEvent.match(/LOCATION:(.+)/)

    return NextResponse.json({
      url: httpsUrl,
      rawEvent: firstEvent,
      extracted: {
        uid: uidMatch?.[1] || 'NOT FOUND',
        summary: summaryMatch?.[1] || 'NOT FOUND',
        description: descMatch?.[1]?.slice(0, 500) || 'NOT FOUND',
        dtstart: dtstartMatch?.[1] || 'NOT FOUND',
        dtend: dtendMatch?.[1] || 'NOT FOUND',
        location: locationMatch?.[1] || 'NOT FOUND',
      },
      descriptionBytes: descMatch ? Array.from(descMatch[1].slice(0, 100)).map(c => c.charCodeAt(0)) : null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
