import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use raw query to get google calendar fields that aren't in the typed schema yet
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ connected: false })
    }

    const connected = !!(data as any).google_calendar_access_token
    const expired = (data as any).google_calendar_token_expiry
      ? new Date((data as any).google_calendar_token_expiry) < new Date()
      : false

    return NextResponse.json({
      connected,
      expired,
      hasRefreshToken: !!(data as any).google_calendar_refresh_token,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
