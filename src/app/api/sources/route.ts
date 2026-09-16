import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SourceConnection } from '@/lib/supabase/database.types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    const tenantId = userData?.tenant_id

    // Get all source definitions
    const { data: definitions, error: defError } = await supabase
      .from('source_definitions')
      .select('*')
      .order('sort_order', { ascending: true })

    console.log('Source definitions query result:', { definitions, defError })

    if (defError) throw defError

    // Get user's source connections with definitions
    const { data: sources, error: srcError } = await supabase
      .from('source_connections')
      .select(`
        *,
        definition:source_definitions(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (srcError) throw srcError

    return NextResponse.json({
      definitions: definitions || [],
      sources: sources || [],
      debug: {
        userId: user.id,
        tenantId,
        definitionsCount: definitions?.length || 0,
        sourcesCount: sources?.length || 0,
      }
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    console.log('User lookup result:', { userData, userError })

    if (userError) {
      console.error('User lookup error:', userError)
      return NextResponse.json({ error: `User lookup failed: ${userError.message}` }, { status: 400 })
    }
    
    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'User has no tenant_id assigned', userId: user.id }, { status: 400 })
    }

    const body = await request.json()
    console.log('POST /api/sources body:', body)

    const insertData = {
      tenant_id: userData?.tenant_id,
      user_id: user.id,
      source_definition_id: body.source_definition_id,
      name: body.name,
      connection_method: body.connection_method || 'ical_feed',
      feed_url_encrypted: body.feed_url_encrypted,
      refresh_interval_minutes: body.refresh_interval_minutes || 60,
      status: 'pending' as const,
      imported_record_count: 0,
      error_count: 0,
    }
    console.log('Inserting:', insertData)

    const { data, error } = await supabase
      .from('source_connections')
      .insert(insertData)
      .select()
      .single() as { data: SourceConnection | null; error: Error | null }

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('POST /api/sources error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined },
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

    const { data, error } = await supabase
      .from('source_connections')
      .update({
        name: body.name,
        feed_url_encrypted: body.feed_url_encrypted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', body.id)
      .eq('user_id', user.id)
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

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('source_connections')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
