import { createClient } from './supabase/server'
import type { SourceDefinition, SourceConnection } from './supabase/database.types'

export async function getSourceDefinitions(): Promise<SourceDefinition[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('source_definitions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getUserSources(userId: string): Promise<(SourceConnection & { definition: SourceDefinition })[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('source_connections')
    .select(`
      *,
      definition:source_definitions(*)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as unknown as (SourceConnection & { definition: SourceDefinition })[]
}

export interface CreateSourceInput {
  tenant_id: string
  user_id: string
  source_definition_id: string
  name: string
  connection_method: 'oauth' | 'api_token' | 'ical_feed' | 'email' | 'manual'
  feed_url_encrypted?: string
  refresh_interval_minutes?: number
}

export async function createSourceConnection(input: CreateSourceInput): Promise<SourceConnection> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('source_connections')
    .insert({
      ...input,
      status: 'pending',
      imported_record_count: 0,
      error_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSourceConnection(
  id: string,
  updates: Partial<Pick<SourceConnection, 'name' | 'feed_url_encrypted' | 'refresh_interval_minutes' | 'status' | 'is_active'>>
): Promise<SourceConnection> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('source_connections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSourceConnection(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('source_connections')
    .delete()
    .eq('id', id)

  if (error) throw error
}
