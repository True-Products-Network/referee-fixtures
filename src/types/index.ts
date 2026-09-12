// ============================================
// Referee Fixture Hub - Core Types
// ============================================

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  tenant_id: string;
  full_name: string | null;
  phone: string | null;
  home_address: string | null;
  home_lat: number | null;
  home_lng: number | null;
  role: 'admin' | 'referee';
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  timezone: string;
  default_arrival_lead_minutes: number;
  default_post_match_buffer_minutes: number;
  default_parking_buffer_minutes: number;
  mileage_rate: number;
  use_tax_mileage_rate: boolean;
  google_calendar_ids: string[];
  fixture_calendar_name: string;
  notification_preferences: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

// ============================================
// Configuration Types
// ============================================

export interface ConfigurationDefinition {
  id: string;
  key: string;
  data_type: 'string' | 'number' | 'boolean' | 'json' | 'date';
  allowed_scopes: string[];
  validation_rule: string | null;
  description: string;
  category: string;
  created_at: string;
}

export interface ConfigurationValue {
  id: string;
  definition_id: string;
  scope_type: 'global' | 'tenant' | 'user' | 'source' | 'competition' | 'role' | 'age_group' | 'venue' | 'event' | 'fixture';
  scope_id: string | null;
  value: any;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Lookup Types
// ============================================

export interface AppointmentStatus {
  id: string;
  status: string;
  label: string;
  description: string;
  color: string;
  google_calendar_action: 'create' | 'update' | 'remove' | 'cancel' | 'none';
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PaymentStatus {
  id: string;
  status: string;
  label: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface FixtureRole {
  id: string;
  role: string;
  label: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SourceDefinition {
  id: string;
  name: string;
  label: string;
  adapter_type: 'api' | 'ical' | 'email' | 'csv' | 'manual';
  capabilities: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// ============================================
// Source Connection Types
// ============================================

export interface SourceConnection {
  id: string;
  tenant_id: string;
  user_id: string;
  source_definition_id: string;
  name: string;
  connection_method: 'oauth' | 'api_token' | 'ical_feed' | 'email' | 'manual';
  credentials_encrypted: string | null;
  feed_url_encrypted: string | null;
  refresh_interval_minutes: number;
  last_successful_check: string | null;
  next_planned_check: string | null;
  imported_record_count: number;
  error_count: number;
  status: 'active' | 'error' | 'paused' | 'pending';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SourceRecord {
  id: string;
  tenant_id: string;
  source_connection_id: string;
  source_record_id: string;
  source_uid: string | null;
  raw_payload: any;
  import_method: string;
  imported_at: string;
  version: number;
  is_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SourceSyncRun {
  id: string;
  tenant_id: string;
  source_connection_id: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  started_at: string;
  completed_at: string | null;
  records_imported: number;
  records_updated: number;
  records_failed: number;
  errors: any[];
  cursor: string | null;
  created_at: string;
}

// ============================================
// Fixture Types
// ============================================

export interface Fixture {
  id: string;
  tenant_id: string;
  user_id: string;
  
  // Identity and source
  source_name: string;
  source_organisation?: string | null;
  source_record_id?: string | null;
  source_uid?: string | null;
  source_url?: string | null;
  source_version?: string | null;
  import_method?: string;
  raw_source_record_id?: string | null;
  last_successful_source_check?: string | null;
  
  // Match details
  sport?: string;
  competition?: string | null;
  season?: string | null;
  age_group?: string | null;
  division?: string | null;
  home_team: string;
  away_team: string;
  fixture_number?: string | null;
  fixture_notes?: string | null;
  
  // Appointment details
  offer_received_time?: string | null;
  response_deadline?: string | null;
  appointment_status: string;
  acceptance_status?: string | null;
  role: string;
  crew_names?: string[] | null;
  crew_contacts?: any[] | null;
  assignor_name?: string | null;
  assignor_contact?: string | null;
  uniform_instructions?: string | null;
  
  // Time details
  timezone?: string;
  kickoff_start: string;
  expected_match_end?: string | null;
  required_arrival_time?: string | null;
  planned_departure_time?: string | null;
  pre_match_buffer_minutes?: number;
  post_match_buffer_minutes?: number;
  travel_time_before_minutes?: number | null;
  travel_time_after_minutes?: number | null;
  
  // Venue details
  venue_id?: string | null;
  
  // Financial details
  expected_match_fee?: number | null;
  travel_fee?: number | null;
  mileage_reimbursement?: number | null;
  other_reimbursement?: number | null;
  parking_cost?: number | null;
  toll_cost?: number | null;
  other_expense?: number | null;
  expected_gross_amount?: number | null;
  expected_net_amount?: number | null;
  payment_status: string;
  paid_amount?: number | null;
  payment_date?: string | null;
  payment_method?: string | null;
  payment_reference?: string | null;
  
  // System details
  conflict_status?: 'available' | 'tight' | 'unavailable' | 'unknown' | null;
  conflict_reason?: string | null;
  data_quality_status?: string | null;
  duplicate_group_id?: string | null;
  google_calendar_event_id?: string | null;
  
  created_at?: string;
  updated_at?: string;
  archived_at?: string | null;
}

export interface FixtureSource {
  id: string;
  fixture_id: string;
  source_record_id: string;
  link_type: 'primary' | 'duplicate' | 'cross_source';
  created_at: string;
}

export interface FixtureAssignment {
  id: string;
  fixture_id: string;
  user_id: string;
  role: string;
  response: 'accepted' | 'declined' | 'pending' | null;
  response_time: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// Venue Types
// ============================================

export interface Venue {
  id: string;
  tenant_id: string;
  name: string;
  pitch_or_field: string | null;
  street_address: string;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  parking_instructions: string | null;
  venue_notes: string | null;
  map_link: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Travel Types
// ============================================

export interface TravelEstimate {
  id: string;
  tenant_id: string;
  from_venue_id: string | null;
  to_venue_id: string | null;
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  distance_miles: number;
  duration_minutes: number;
  traffic_duration_minutes: number | null;
  toll_info: any | null;
  route_link: string | null;
  calculated_at: string;
  expires_at: string;
  created_at: string;
}

// ============================================
// Calendar Types
// ============================================

export interface CalendarLink {
  id: string;
  tenant_id: string;
  fixture_id: string;
  google_event_id: string;
  google_calendar_id: string;
  sync_status: 'synced' | 'pending' | 'error' | 'removed';
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarBusyBlock {
  id: string;
  tenant_id: string;
  user_id: string;
  google_calendar_id: string;
  google_event_id: string;
  start_time: string;
  end_time: string;
  summary: string | null;
  location: string | null;
  is_busy: boolean;
  fetched_at: string;
  created_at: string;
}

// ============================================
// Financial Types
// ============================================

export interface Expense {
  id: string;
  tenant_id: string;
  fixture_id: string;
  user_id: string;
  expense_type: 'mileage' | 'parking' | 'toll' | 'other';
  description: string | null;
  amount: number;
  distance_miles: number | null;
  receipt_url: string | null;
  incurred_at: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  fixture_id: string;
  user_id: string;
  expected_amount: number;
  paid_amount: number | null;
  payment_status: string;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Conflict Check Types
// ============================================

export interface ConflictCheck {
  id: string;
  tenant_id: string;
  fixture_id: string;
  user_id: string;
  result: 'available' | 'tight' | 'unavailable' | 'unknown';
  reason: string | null;
  input_values: any;
  override_reason: string | null;
  override_at: string | null;
  created_at: string;
}

// ============================================
// Notification Types
// ============================================

export interface NotificationType {
  id: string;
  event: string;
  label: string;
  description: string;
  default_channels: string[];
  template_subject: string | null;
  template_body: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  notification_type_id: string;
  title: string;
  message: string;
  data: any;
  channels: string[];
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

// ============================================
// Audit Types
// ============================================

export interface AuditLog {
  id: string;
  tenant_id: string;
  table_name: string;
  record_id: string;
  action: 'insert' | 'update' | 'delete';
  old_values: any;
  new_values: any;
  changed_by: string;
  changed_at: string;
  ip_address: string | null;
}

// ============================================
// Rule Types
// ============================================

export interface FeeRule {
  id: string;
  tenant_id: string;
  scope_type: string;
  scope_id: string | null;
  rule_type: 'match_fee' | 'travel_fee' | 'mileage_rate' | 'reimbursement' | 'expense_category';
  amount: number | null;
  rate_per_unit: number | null;
  unit_type: string | null;
  conditions: any;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArrivalRule {
  id: string;
  tenant_id: string;
  scope_type: string;
  scope_id: string | null;
  competition_type: string | null;
  role: string | null;
  age_group: string | null;
  arrival_lead_minutes: number;
  parking_buffer_minutes: number;
  match_duration_minutes: number;
  post_match_buffer_minutes: number;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Feature / Plan Types
// ============================================

export interface FeatureDefinition {
  id: string;
  feature: string;
  label: string;
  description: string;
  config_requirements: any;
  is_active: boolean;
  created_at: string;
}

export interface PlanEntitlement {
  id: string;
  plan_name: string;
  feature_id: string;
  limit: number | null;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Review Queue Types
// ============================================

export interface ReviewQueueItem {
  id: string;
  tenant_id: string;
  item_type: 'duplicate' | 'low_confidence_email' | 'missing_venue' | 'unmatched_change' | 'unclear_status' | 'google_mirror_error';
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  fixture_id: string | null;
  source_record_id: string | null;
  description: string;
  data: any;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// ============================================
// Adapter Types
// ============================================

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface SourceChangeBatch {
  changes: SourceFixture[];
  cursor: string | null;
  hasMore: boolean;
}

export interface SourceFixture {
  sourceRecordId: string;
  sourceUid: string | null;
  version: string | null;
  status: string;
  startTime: string;
  endTime: string | null;
  summary: string;
  description: string | null;
  location: string | null;
  url: string | null;
  lastModified: string | null;
  raw: any;
}

export interface FixtureDraft {
  source_name: string;
  source_record_id: string;
  source_uid: string | null;
  sport: string;
  competition: string | null;
  home_team: string;
  away_team: string;
  kickoff_start: string;
  expected_match_end: string | null;
  venue_name: string | null;
  venue_address: string | null;
  role: string;
  expected_match_fee: number | null;
  raw_payload: any;
}

export interface ActionResult {
  success: boolean;
  message: string;
}

// ============================================
// UI Types
// ============================================

export interface CalendarView {
  date: Date;
  fixtures: Fixture[];
}

export interface EarningsSummary {
  period: string;
  expected_gross: number;
  expected_net: number;
  paid_amount: number;
  unpaid_amount: number;
  mileage_total: number;
  expenses_total: number;
  fixture_count: number;
}

export interface TodayView {
  next_fixture: Fixture | null;
  countdown_minutes: number | null;
  travel_warning: string | null;
  source_change_warning: string | null;
}
