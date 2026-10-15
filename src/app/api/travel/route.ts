import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateTravelWithCache } from '@/lib/travel'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from || !to) {
      return NextResponse.json({ error: 'Origin and destination required' }, { status: 400 })
    }

    const result = await calculateTravelWithCache(from, to)

    if (!result) {
      return NextResponse.json({
        estimated: true,
        durationMinutes: 30,
        distanceMiles: null,
        note: 'Using default estimate (API unavailable)',
      })
    }

    return NextResponse.json({
      estimated: false,
      durationMinutes: result.durationInTrafficMinutes || result.durationMinutes,
      distanceMiles: result.distanceMiles,
      origin: result.origin,
      destination: result.destination,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
