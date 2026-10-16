import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const userData = data as any

    return NextResponse.json({
      full_name: userData.full_name,
      phone: userData.phone,
      home_address: userData.home_address,
      home_lat: userData.home_lat,
      home_lng: userData.home_lng,
      mileage_rate: userData.mileage_rate,
      timezone: userData.timezone,
    })
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

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.full_name !== undefined) updates.full_name = body.full_name
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.home_address !== undefined) updates.home_address = body.home_address
    if (body.mileage_rate !== undefined) updates.mileage_rate = body.mileage_rate
    if (body.timezone !== undefined) updates.timezone = body.timezone

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    const userData = data as any

    return NextResponse.json({
      full_name: userData.full_name,
      phone: userData.phone,
      home_address: userData.home_address,
      mileage_rate: userData.mileage_rate,
      timezone: userData.timezone,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
