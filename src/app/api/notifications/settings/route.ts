import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const tenantId = userData?.tenant_id || user.id

    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching notification settings:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const tenantId = userData?.tenant_id || user.id

    const { settings } = await request.json()

    // Delete existing settings for this tenant
    await supabase
      .from('notification_settings')
      .delete()
      .eq('tenant_id', tenantId)

    // Insert new settings
    if (settings && settings.length > 0) {
      const { error } = await supabase
        .from('notification_settings')
        .insert(
          settings.map((setting: any) => ({
            tenant_id: tenantId,
            user_id: user.id,
            notification_type: setting.id,
            title: setting.title,
            description: setting.description,
            push_enabled: setting.push_enabled,
            email_enabled: setting.email_enabled,
            icon: setting.icon,
          }))
        )

      if (error) {
        console.error('Error saving notification settings:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
