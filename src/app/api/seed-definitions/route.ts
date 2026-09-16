import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SeedDefinition {
  name: string
  label: string
  adapter_type: 'api' | 'ical' | 'email' | 'csv' | 'manual'
  capabilities: string[]
  sort_order: number
}

const DEFAULT_DEFINITIONS: SeedDefinition[] = [
  { name: 'assignr', label: 'Assignr', adapter_type: 'ical', capabilities: ['read','ical_feed'], sort_order: 1 },
  { name: 'arbiter', label: 'ArbiterSports', adapter_type: 'ical', capabilities: ['read','ical_feed'], sort_order: 2 },
  { name: 'eventlink', label: 'EventLink', adapter_type: 'ical', capabilities: ['read','ical_feed'], sort_order: 3 },
  { name: 'refquest', label: 'RefQuest / RQ+', adapter_type: 'email', capabilities: ['read','email'], sort_order: 4 },
  { name: 'refr_sports', label: 'Refr Sports', adapter_type: 'email', capabilities: ['read','email'], sort_order: 5 },
  { name: 'manual', label: 'Manual Entry', adapter_type: 'manual', capabilities: ['read','write'], sort_order: 6 },
  { name: 'csv_import', label: 'CSV Import', adapter_type: 'csv', capabilities: ['read','bulk_import'], sort_order: 7 },
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = []
    for (const def of DEFAULT_DEFINITIONS) {
      const { data, error } = await supabase
        .from('source_definitions')
        .upsert(def as any, { onConflict: 'name' })
        .select()
        .single()
      
      if (error) {
        console.error('Error inserting definition:', def.name, error)
        results.push({ name: def.name, error: error.message })
      } else {
        results.push({ name: def.name, id: data.id })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${results.filter(r => !r.error).length} definitions`,
      results 
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('source_definitions')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ 
      count: data?.length || 0,
      definitions: data || []
    })
  } catch (error) {
    console.error('Check error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
