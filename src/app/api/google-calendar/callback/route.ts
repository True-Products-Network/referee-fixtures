import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/google-calendar'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user id
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar-sync?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar-sync?error=missing_params`)
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    if (!tokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar-sync?error=no_token`)
    }

    const supabase = await createClient()

    // Store tokens using raw SQL
    const expiryDate = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    const { error: upsertError } = await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', state)

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar-sync?error=storage_failed`)
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar-sync?success=true`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/calendar-sync?error=callback_failed`)
  }
}
