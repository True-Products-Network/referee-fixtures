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
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const status = searchParams.get('status')
    const source = searchParams.get('source')

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
