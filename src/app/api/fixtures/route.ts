import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const status = searchParams.get('status')
    const source = searchParams.get('source')

    // If id is provided, fetch single fixture directly
    if (id) {
      const { data, error } = await supabase
        .from('fixtures')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('archived_at', null)
        .single() as { data: any; error: Error | null }

      if (error) {
        return NextResponse.json({ error: 'Fixture not found' }, { status: 404 })
      }

      return NextResponse.json({ fixture: data })
    }

    let query = supabase
      .from('fixtures')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('kickoff_start', { ascending: true })

    if (from) {
      query = query.gte('kickoff_start', from)
    }
    if (to) {
      query = query.lte('kickoff_start', to)
    }
    if (status) {
      query = query.eq('appointment_status', status)
    }
    if (source) {
      query = query.eq('source_name', source)
    }

    const { data, error } = await query as { data: any[] | null; error: Error | null }

    if (error) throw error

    return NextResponse.json({ fixtures: data || [] })
  } catch (error) {
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
      .single() as { data: any; error: any }

    const tenantId = userData?.tenant_id || '00000000-0000-0000-0000-000000000001'

    const body = await request.json()

    const { data, error } = await supabase
      .from('fixtures')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        source_name: body.source_name || 'Manual',
        home_team: body.home_team || 'TBD',
        away_team: body.away_team || 'TBD',
        sport: body.sport || 'soccer',
        kickoff_start: body.kickoff_start,
        expected_match_end: body.expected_match_end || null,
        required_arrival_time: body.required_arrival_time || null,
        planned_departure_time: body.planned_departure_time || null,
        appointment_status: body.appointment_status || 'offered',
        payment_status: body.payment_status || 'expected',
        role: body.role || 'referee',
        venue_name: body.venue_name || null,
        expected_gross_amount: body.expected_gross_amount || null,
        import_method: body.import_method || 'manual',
        timezone: body.timezone || 'America/Chicago',
        pre_match_buffer_minutes: body.pre_match_buffer_minutes || 45,
        post_match_buffer_minutes: body.post_match_buffer_minutes || 15,
      })
      .select()
      .single() as { data: any; error: Error | null }

    if (error) throw error

    return NextResponse.json({ fixture: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Fixture ID required' }, { status: 400 })
    }

    // Verify the fixture belongs to this user
    const { data: existing } = await supabase
      .from('fixtures')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single() as { data: any; error: any }

    if (!existing) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('fixtures')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single() as { data: any; error: Error | null }

    if (error) throw error

    return NextResponse.json({ fixture: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
