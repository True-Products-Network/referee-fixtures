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
    const period = searchParams.get('period') || 'month' // week, month, year, all

    let query = supabase
      .from('fixtures')
      .select('*')
      .eq('user_id', user.id)
      .is('archived_at', null)
      .order('kickoff_start', { ascending: true })

    // Date filtering
    if (from) {
      query = query.gte('kickoff_start', from)
    }
    if (to) {
      query = query.lte('kickoff_start', to)
    }

    const { data: fixtures, error } = await query as { data: any[] | null; error: Error | null }

    if (error) throw error

    const allFixtures = fixtures || []

    // Calculate summary stats
    const completedFixtures = allFixtures.filter(f => f.appointment_status === 'completed')
    const paidFixtures = completedFixtures.filter(f => f.payment_status === 'paid')
    const unpaidFixtures = completedFixtures.filter(f => f.payment_status === 'expected' || f.payment_status === 'overdue')
    const upcomingFixtures = allFixtures.filter(f => 
      f.appointment_status !== 'completed' && 
      f.appointment_status !== 'cancelled' &&
      f.appointment_status !== 'declined'
    )

    const totalExpected = allFixtures.reduce((sum, f) => sum + (f.expected_gross_amount || 0), 0)
    const totalPaid = paidFixtures.reduce((sum, f) => sum + (f.paid_amount || 0), 0)
    const totalUnpaid = unpaidFixtures.reduce((sum, f) => sum + (f.expected_gross_amount || 0), 0)
    const totalUpcoming = upcomingFixtures.reduce((sum, f) => sum + (f.expected_gross_amount || 0), 0)

    // Stats by source
    const sourceStats: Record<string, { count: number; expected: number; paid: number }> = {}
    allFixtures.forEach(f => {
      const source = f.source_name || 'Unknown'
      if (!sourceStats[source]) {
        sourceStats[source] = { count: 0, expected: 0, paid: 0 }
      }
      sourceStats[source].count++
      sourceStats[source].expected += f.expected_gross_amount || 0
      if (f.payment_status === 'paid') {
        sourceStats[source].paid += f.paid_amount || 0
      }
    })

    // Monthly breakdown (for year view)
    const monthlyBreakdown: Record<string, { expected: number; paid: number; count: number }> = {}
    allFixtures.forEach(f => {
      const month = f.kickoff_start?.substring(0, 7) // YYYY-MM
      if (!month) return
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = { expected: 0, paid: 0, count: 0 }
      }
      monthlyBreakdown[month].expected += f.expected_gross_amount || 0
      if (f.payment_status === 'paid') {
        monthlyBreakdown[month].paid += f.paid_amount || 0
      }
      monthlyBreakdown[month].count++
    })

    return NextResponse.json({
      fixtures: allFixtures,
      summary: {
        totalExpected,
        totalPaid,
        totalUnpaid,
        totalUpcoming,
        fixtureCount: allFixtures.length,
        completedCount: completedFixtures.length,
        paidCount: paidFixtures.length,
        unpaidCount: unpaidFixtures.length,
        upcomingCount: upcomingFixtures.length,
      },
      sourceStats,
      monthlyBreakdown,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
