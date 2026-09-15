export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          plan_name: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          plan_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          plan_name?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          full_name: string | null
          phone: string | null
          home_address: string | null
          home_lat: number | null
          home_lng: number | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          email: string
          full_name?: string | null
          phone?: string | null
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          home_address?: string | null
          home_lat?: number | null
          home_lng?: number | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          source_name: string
          source_organisation: string | null
          source_record_id: string | null
          source_uid: string | null
          source_url: string | null
          source_version: string | null
          import_method: string
          raw_source_record_id: string | null
          last_successful_source_check: string | null
          sport: string
          competition: string | null
          season: string | null
          age_group: string | null
          division: string | null
          home_team: string
          away_team: string
          fixture_number: string | null
          fixture_notes: string | null
          offer_received_time: string | null
          response_deadline: string | null
          appointment_status: string
          acceptance_status: string | null
          role: string
          crew_names: string[] | null
          crew_contacts: Json | null
          assignor_name: string | null
          assignor_contact: string | null
          uniform_instructions: string | null
          timezone: string
          kickoff_start: string
          expected_match_end: string | null
          required_arrival_time: string | null
          planned_departure_time: string | null
          pre_match_buffer_minutes: number
          post_match_buffer_minutes: number
          travel_time_before_minutes: number | null
          travel_time_after_minutes: number | null
          venue_id: string | null
          expected_match_fee: number | null
          travel_fee: number | null
          mileage_reimbursement: number | null
          other_reimbursement: number | null
          parking_cost: number | null
          toll_cost: number | null
          other_expense: number | null
          expected_gross_amount: number | null
          expected_net_amount: number | null
          payment_status: string
          paid_amount: number | null
          payment_date: string | null
          payment_method: string | null
          payment_reference: string | null
          conflict_status: string | null
          conflict_reason: string | null
          data_quality_status: string | null
          duplicate_group_id: string | null
          google_calendar_event_id: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          source_name: string
          source_organisation?: string | null
          source_record_id?: string | null
          source_uid?: string | null
          source_url?: string | null
          source_version?: string | null
          import_method?: string
          raw_source_record_id?: string | null
          last_successful_source_check?: string | null
          sport?: string
          competition?: string | null
          season?: string | null
          age_group?: string | null
          division?: string | null
          home_team: string
          away_team: string
          fixture_number?: string | null
          fixture_notes?: string | null
          offer_received_time?: string | null
          response_deadline?: string | null
          appointment_status?: string
          acceptance_status?: string | null
          role?: string
          crew_names?: string[] | null
          crew_contacts?: Json | null
          assignor_name?: string | null
          assignor_contact?: string | null
          uniform_instructions?: string | null
          timezone?: string
          kickoff_start: string
          expected_match_end?: string | null
          required_arrival_time?: string | null
          planned_departure_time?: string | null
          pre_match_buffer_minutes?: number
          post_match_buffer_minutes?: number
          travel_time_before_minutes?: number | null
          travel_time_after_minutes?: number | null
          venue_id?: string | null
          expected_match_fee?: number | null
          travel_fee?: number | null
          mileage_reimbursement?: number | null
          other_reimbursement?: number | null
          parking_cost?: number | null
          toll_cost?: number | null
          other_expense?: number | null
          expected_gross_amount?: number | null
          expected_net_amount?: number | null
          payment_status?: string
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          conflict_status?: string | null
          conflict_reason?: string | null
          data_quality_status?: string | null
          duplicate_group_id?: string | null
          google_calendar_event_id?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          source_name?: string
          source_organisation?: string | null
          source_record_id?: string | null
          source_uid?: string | null
          source_url?: string | null
          source_version?: string | null
          import_method?: string
          raw_source_record_id?: string | null
          last_successful_source_check?: string | null
          sport?: string
          competition?: string | null
          season?: string | null
          age_group?: string | null
          division?: string | null
          home_team?: string
          away_team?: string
          fixture_number?: string | null
          fixture_notes?: string | null
          offer_received_time?: string | null
          response_deadline?: string | null
          appointment_status?: string
          acceptance_status?: string | null
          role?: string
          crew_names?: string[] | null
          crew_contacts?: Json | null
          assignor_name?: string | null
          assignor_contact?: string | null
          uniform_instructions?: string | null
          timezone?: string
          kickoff_start?: string
          expected_match_end?: string | null
          required_arrival_time?: string | null
          planned_departure_time?: string | null
          pre_match_buffer_minutes?: number
          post_match_buffer_minutes?: number
          travel_time_before_minutes?: number | null
          travel_time_after_minutes?: number | null
          venue_id?: string | null
          expected_match_fee?: number | null
          travel_fee?: number | null
          mileage_reimbursement?: number | null
          other_reimbursement?: number | null
          parking_cost?: number | null
          toll_cost?: number | null
          other_expense?: number | null
          expected_gross_amount?: number | null
          expected_net_amount?: number | null
          payment_status?: string
          paid_amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          conflict_status?: string | null
          conflict_reason?: string | null
          data_quality_status?: string | null
          duplicate_group_id?: string | null
          google_calendar_event_id?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Relationships: []
      }
      source_definitions: {
        Row: {
          id: string
          name: string
          label: string
          adapter_type: 'api' | 'ical' | 'email' | 'csv' | 'manual'
          capabilities: string[]
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          label: string
          adapter_type: 'api' | 'ical' | 'email' | 'csv' | 'manual'
          capabilities?: string[]
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          label?: string
          adapter_type?: 'api' | 'ical' | 'email' | 'csv' | 'manual'
          capabilities?: string[]
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      source_connections: {
        Row: {
          id: string
          tenant_id: string
          user_id: string
          source_definition_id: string
          name: string
          connection_method: 'oauth' | 'api_token' | 'ical_feed' | 'email' | 'manual'
          credentials_encrypted: string | null
          feed_url_encrypted: string | null
          refresh_interval_minutes: number
          last_successful_check: string | null
          next_planned_check: string | null
          imported_record_count: number
          error_count: number
          status: 'active' | 'error' | 'paused' | 'pending'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          user_id: string
          source_definition_id: string
          name: string
          connection_method: 'oauth' | 'api_token' | 'ical_feed' | 'email' | 'manual'
          credentials_encrypted?: string | null
          feed_url_encrypted?: string | null
          refresh_interval_minutes?: number
          last_successful_check?: string | null
          next_planned_check?: string | null
          imported_record_count?: number
          error_count?: number
          status?: 'active' | 'error' | 'paused' | 'pending'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          user_id?: string
          source_definition_id?: string
          name?: string
          connection_method?: 'oauth' | 'api_token' | 'ical_feed' | 'email' | 'manual'
          credentials_encrypted?: string | null
          feed_url_encrypted?: string | null
          refresh_interval_minutes?: number
          last_successful_check?: string | null
          next_planned_check?: string | null
          imported_record_count?: number
          error_count?: number
          status?: 'active' | 'error' | 'paused' | 'pending'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      source_records: {
        Row: {
          id: string
          tenant_id: string
          source_connection_id: string
          source_record_id: string
          source_uid: string | null
          raw_payload: Json
          import_method: string
          imported_at: string
          version: number
          is_processed: boolean
        }
        Insert: {
          id?: string
          tenant_id: string
          source_connection_id: string
          source_record_id: string
          source_uid?: string | null
          raw_payload?: Json
          import_method: string
          imported_at?: string
          version?: number
          is_processed?: boolean
        }
        Update: {
          id?: string
          tenant_id?: string
          source_connection_id?: string
          source_record_id?: string
          source_uid?: string | null
          raw_payload?: Json
          import_method?: string
          imported_at?: string
          version?: number
          is_processed?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Types for source_definitions table
export interface SourceDefinition {
  id: string
  name: string
  label: string
  adapter_type: 'api' | 'ical' | 'email' | 'csv' | 'manual'
  capabilities: string[]
  is_active: boolean
  sort_order: number
  created_at: string
}

// Types for source_connections table
export interface SourceConnection {
  id: string
  tenant_id: string
  user_id: string
  source_definition_id: string
  name: string
  connection_method: 'oauth' | 'api_token' | 'ical_feed' | 'email' | 'manual'
  credentials_encrypted: string | null
  feed_url_encrypted: string | null
  refresh_interval_minutes: number
  last_successful_check: string | null
  next_planned_check: string | null
  imported_record_count: number
  error_count: number
  status: 'active' | 'error' | 'paused' | 'pending'
  is_active: boolean
  created_at: string
  updated_at: string
}
