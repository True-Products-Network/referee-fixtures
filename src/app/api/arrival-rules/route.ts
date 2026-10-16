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

    const { data: rules, error } = await supabase
      .from('arrival_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching arrival rules:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rules: rules || [] })
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

    const { rules } = await request.json()

    // Delete existing rules for this tenant
    await supabase
      .from('arrival_rules')
      .delete()
      .eq('tenant_id', tenantId)

    // Insert new rules
    if (rules && rules.length > 0) {
      const { error } = await supabase
        .from('arrival_rules')
        .insert(
          rules.map((rule: any) => ({
            tenant_id: tenantId,
            scope_type: 'user',
            scope_id: user.id,
            competition_type: rule.competition_type,
            role: rule.role,
            age_group: rule.age_group,
            arrival_lead_minutes: rule.arrival_lead_minutes,
            parking_buffer_minutes: rule.parking_buffer_minutes,
            match_duration_minutes: rule.match_duration_minutes,
            post_match_buffer_minutes: rule.post_match_buffer_minutes,
            effective_from: new Date().toISOString(),
          }))
        )

      if (error) {
        console.error('Error saving arrival rules:', error)
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
