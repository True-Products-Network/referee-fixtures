import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SourceConnection } from '@/lib/supabase/database.types'

// Demo user ID for development - replace with actual auth when login is implemented
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'
const DEMO_TENANT_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Use demo user if not authenticated (development only)
    const userId = user?.id || DEMO_USER_ID
    const isDemo = !user

    console.log('API: User:', userId, isDemo ? '(demo)' : '(authenticated)')

    // Get all source definitions (no RLS, should always work)
    const { data: definitions, error: defError } = await supabase
      .from('source_definitions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    console.log('API: Definitions:', definitions?.length || 0, 'Error:', defError)

    if (defError) throw defError

    // Get user's source connections with definitions
    const { data: sources, error: srcError } = await supabase
      .from('source_connections')
      .select(`
        *,
        definition:source_definitions(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    console.log('API: Sources:', sources?.length || 0, 'Error:', srcError)

    if (srcError) throw srcError

    return NextResponse.json({
      definitions: definitions || [],
      sources: sources || [],
    })
  } catch (error) {
    console.error('API Error:', error)
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

    const userId = user?.id || DEMO_USER_ID
    const tenantId = DEMO_TENANT_ID

    const body = await request.json()

    const { data, error } = await supabase
      .from('source_connections')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        source_definition_id: body.source_definition_id,
        name: body.name,
        connection_method: body.connection_method,
        feed_url_encrypted: body.feed_url_encrypted,
        refresh_interval_minutes: body.refresh_interval_minutes || 60,
        status: 'pending',
        imported_record_count: 0,
        error_count: 0,
      })
      .select()
      .single() as { data: SourceConnection | null; error: Error | null }

    if (error) throw error

    return NextResponse.json(data)
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

    const userId = user?.id || DEMO_USER_ID

    const body = await request.json()

    const { data, error } = await supabase
      .from('source_connections')
      .update({
        name: body.name,
        feed_url_encrypted: body.feed_url_encrypted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('user_id', userId)
      .select()
      .single() as { data: SourceConnection | null; error: Error | null }

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const userId = user?.id || DEMO_USER_ID

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('source_connections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
