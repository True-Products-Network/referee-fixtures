import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CsvRow {
  date: string
  time: string
  home_team: string
  away_team: string
  venue: string
  role: string
  fee: string
  competition: string
  notes: string
}

function parseDateTime(dateStr: string, timeStr: string): Date | null {
  try {
    // Try various date formats
    let date: Date

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      date = new Date(`${dateStr}T00:00:00`)
    }
    // MM/DD/YYYY
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [m, d, y] = dateStr.split('/')
      date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`)
    }
    // DD/MM/YYYY
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/')
      date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`)
    }
    else {
      date = new Date(dateStr)
    }

    if (isNaN(date.getTime())) return null

    // Parse time
    let hours = 0
    let minutes = 0

    // HH:MM (24-hour)
    const time24Match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
    if (time24Match) {
      hours = parseInt(time24Match[1])
      minutes = parseInt(time24Match[2])
    }
    // H:MM AM/PM
    const time12Match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/)
    if (time12Match) {
      hours = parseInt(time12Match[1])
      minutes = parseInt(time12Match[2])
      const period = time12Match[3].toUpperCase()
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
    }

    date.setHours(hours, minutes, 0, 0)
    return date
  } catch {
    return null
  }
}

function normalizeRole(role: string): string {
  const r = role.toLowerCase().trim()
  if (r.includes('center') || r.includes('cr') || r === 'referee') return 'referee'
  if (r.includes('ar1') || r.includes('assistant 1') || r.includes('ar 1')) return 'ar1'
  if (r.includes('ar2') || r.includes('assistant 2') || r.includes('ar 2')) return 'ar2'
  if (r.includes('4th') || r.includes('fourth')) return 'fourth_official'
  return 'referee'
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

    const tenantId = userData?.tenant_id || '00000000-0000-0000-0000-000000000001'

    const body = await request.json()
    const rows: CsvRow[] = body.rows || []

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        const kickoff = parseDateTime(row.date, row.time)
        if (!kickoff) {
          failed++
          errors.push(`Row ${i + 1}: Invalid date/time "${row.date} ${row.time}"`)
          continue
        }

        const homeTeam = row.home_team?.trim() || 'TBD'
        const awayTeam = row.away_team?.trim() || 'TBD'

        if (!homeTeam || !awayTeam) {
          failed++
          errors.push(`Row ${i + 1}: Missing team names`)
          continue
        }

        // Calculate match end (default 90 minutes)
        const matchEnd = new Date(kickoff.getTime() + 90 * 60 * 1000)

        const role = normalizeRole(row.role || 'referee')
        const fee = row.fee ? parseFloat(row.fee.replace('$', '').trim()) : null

        const { error: insertError } = await supabase
          .from('fixtures')
          .insert({
            tenant_id: tenantId,
            user_id: user.id,
            source_name: 'CSV Import',
            home_team: homeTeam,
            away_team: awayTeam,
            sport: 'soccer',
            competition: row.competition || null,
            appointment_status: 'confirmed',
            role,
            timezone: 'America/Chicago',
            kickoff_start: kickoff.toISOString(),
            expected_match_end: matchEnd.toISOString(),
            venue_name: row.venue || null,
            expected_gross_amount: fee,
            payment_status: 'expected',
            import_method: 'csv',
            pre_match_buffer_minutes: 0,
            post_match_buffer_minutes: 15,
            fixture_notes: row.notes || null,
          })

        if (insertError) {
          failed++
          errors.push(`Row ${i + 1}: ${insertError.message}`)
        } else {
          success++
        }
      } catch (err) {
        failed++
        errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors: errors.slice(0, 20), // Limit errors returned
      total: rows.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
