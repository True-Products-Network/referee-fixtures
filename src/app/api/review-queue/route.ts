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

    // Get all non-dismissed/non-resolved issues
    const { data: issues, error } = await supabase
      .from('review_queue')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .in('status', ['pending', 'new'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching review queue:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ issues: issues || [] })
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

    const { action, issueKey, fixtureId, issueType, description, severity } = await request.json()

    if (action === 'dismiss' || action === 'resolve') {
      // Upsert the issue with dismissed/resolved status
      const { error } = await supabase
        .from('review_queue')
        .upsert({
          tenant_id: tenantId,
          user_id: user.id,
          fixture_id: fixtureId,
          issue_type: issueType,
          issue_key: issueKey,
          description,
          severity: severity || 'warning',
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          resolved_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id,issue_key'
        })

      if (error) {
        console.error('Error updating review queue:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
