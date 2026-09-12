-- ============================================
-- Referee Fixture Hub - Initial Schema
-- ============================================
-- This migration creates the complete database schema
-- for the Referee Fixture Hub application.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. TENANTS (Multi-account boundary)
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan_name TEXT DEFAULT 'personal',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. USERS (Login identity - managed by Supabase Auth)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    home_address TEXT,
    home_lat DECIMAL(10, 8),
    home_lng DECIMAL(11, 8),
    role TEXT DEFAULT 'referee' CHECK (role IN ('admin', 'referee')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. USER SETTINGS
-- ============================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timezone TEXT DEFAULT 'America/New_York',
    default_arrival_lead_minutes INTEGER DEFAULT 45,
    default_post_match_buffer_minutes INTEGER DEFAULT 15,
    default_parking_buffer_minutes INTEGER DEFAULT 10,
    mileage_rate DECIMAL(10, 4) DEFAULT 0.67,
    use_tax_mileage_rate BOOLEAN DEFAULT true,
    google_calendar_ids JSONB DEFAULT '[]',
    fixture_calendar_name TEXT DEFAULT 'Referee Fixtures',
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================
-- 4. CONFIGURATION DEFINITIONS
-- ============================================
CREATE TABLE configuration_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('string', 'number', 'boolean', 'json', 'date')),
    allowed_scopes TEXT[] DEFAULT ARRAY['global'],
    validation_rule TEXT,
    description TEXT,
    category TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CONFIGURATION VALUES
-- ============================================
CREATE TABLE configuration_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    definition_id UUID NOT NULL REFERENCES configuration_definitions(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL DEFAULT 'global' 
        CHECK (scope_type IN ('global', 'tenant', 'user', 'source', 'competition', 'role', 'age_group', 'venue', 'event', 'fixture')),
    scope_id UUID,
    value JSONB NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. LOOKUP TABLES
-- ============================================

-- Appointment Statuses
CREATE TABLE appointment_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    google_calendar_action TEXT DEFAULT 'none' 
        CHECK (google_calendar_action IN ('create', 'update', 'remove', 'cancel', 'none')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Statuses
CREATE TABLE payment_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fixture Roles
CREATE TABLE fixture_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source Definitions
CREATE TABLE source_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    adapter_type TEXT NOT NULL CHECK (adapter_type IN ('api', 'ical', 'email', 'csv', 'manual')),
    capabilities TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Definitions
CREATE TABLE feature_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    config_requirements JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan Entitlements
CREATE TABLE plan_entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name TEXT NOT NULL,
    feature_id UUID NOT NULL REFERENCES feature_definitions(id) ON DELETE CASCADE,
    limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plan_name, feature_id)
);

-- Notification Types
CREATE TABLE notification_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    default_channels TEXT[] DEFAULT ARRAY['push'],
    template_subject TEXT,
    template_body TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. RULE TABLES
-- ============================================

-- Fee Rules
CREATE TABLE fee_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL DEFAULT 'tenant',
    scope_id UUID,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('match_fee', 'travel_fee', 'mileage_rate', 'reimbursement', 'expense_category')),
    amount DECIMAL(10, 2),
    rate_per_unit DECIMAL(10, 4),
    unit_type TEXT,
    conditions JSONB DEFAULT '{}',
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arrival Rules
CREATE TABLE arrival_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    scope_type TEXT NOT NULL DEFAULT 'tenant',
    scope_id UUID,
    competition_type TEXT,
    role TEXT,
    age_group TEXT,
    arrival_lead_minutes INTEGER DEFAULT 45,
    parking_buffer_minutes INTEGER DEFAULT 10,
    match_duration_minutes INTEGER DEFAULT 90,
    post_match_buffer_minutes INTEGER DEFAULT 15,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. SOURCE CONNECTIONS
-- ============================================
CREATE TABLE source_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_definition_id UUID NOT NULL REFERENCES source_definitions(id),
    name TEXT NOT NULL,
    connection_method TEXT NOT NULL CHECK (connection_method IN ('oauth', 'api_token', 'ical_feed', 'email', 'manual')),
    credentials_encrypted TEXT,
    feed_url_encrypted TEXT,
    refresh_interval_minutes INTEGER DEFAULT 60,
    last_successful_check TIMESTAMPTZ,
    next_planned_check TIMESTAMPTZ,
    imported_record_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'error', 'paused', 'pending')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Source Records (raw imported data)
CREATE TABLE source_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_connection_id UUID NOT NULL REFERENCES source_connections(id) ON DELETE CASCADE,
    source_record_id TEXT NOT NULL,
    source_uid TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}',
    import_method TEXT NOT NULL,
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    is_processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_connection_id, source_record_id)
);

-- Source Sync Runs
CREATE TABLE source_sync_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_connection_id UUID NOT NULL REFERENCES source_connections(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    records_imported INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    cursor TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. VENUES
-- ============================================
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pitch_or_field TEXT,
    street_address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    parking_instructions TEXT,
    venue_notes TEXT,
    map_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. FIXTURES (Core table)
-- ============================================
CREATE TABLE fixtures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Identity and source
    source_name TEXT NOT NULL,
    source_organisation TEXT,
    source_record_id TEXT,
    source_uid TEXT,
    source_url TEXT,
    source_version TEXT,
    import_method TEXT NOT NULL DEFAULT 'manual',
    raw_source_record_id UUID REFERENCES source_records(id),
    last_successful_source_check TIMESTAMPTZ,
    
    -- Match details
    sport TEXT DEFAULT 'soccer',
    competition TEXT,
    season TEXT,
    age_group TEXT,
    division TEXT,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    fixture_number TEXT,
    fixture_notes TEXT,
    
    -- Appointment details
    offer_received_time TIMESTAMPTZ,
    response_deadline TIMESTAMPTZ,
    appointment_status TEXT NOT NULL DEFAULT 'offered' REFERENCES appointment_statuses(status),
    acceptance_status TEXT,
    role TEXT NOT NULL DEFAULT 'referee' REFERENCES fixture_roles(role),
    crew_names TEXT[],
    crew_contacts JSONB DEFAULT '[]',
    assignor_name TEXT,
    assignor_contact TEXT,
    uniform_instructions TEXT,
    
    -- Time details
    timezone TEXT DEFAULT 'America/New_York',
    kickoff_start TIMESTAMPTZ NOT NULL,
    expected_match_end TIMESTAMPTZ,
    required_arrival_time TIMESTAMPTZ,
    planned_departure_time TIMESTAMPTZ,
    pre_match_buffer_minutes INTEGER DEFAULT 0,
    post_match_buffer_minutes INTEGER DEFAULT 15,
    travel_time_before_minutes INTEGER,
    travel_time_after_minutes INTEGER,
    
    -- Venue
    venue_id UUID REFERENCES venues(id),
    
    -- Financial
    expected_match_fee DECIMAL(10, 2),
    travel_fee DECIMAL(10, 2),
    mileage_reimbursement DECIMAL(10, 2),
    other_reimbursement DECIMAL(10, 2),
    parking_cost DECIMAL(10, 2),
    toll_cost DECIMAL(10, 2),
    other_expense DECIMAL(10, 2),
    expected_gross_amount DECIMAL(10, 2),
    expected_net_amount DECIMAL(10, 2),
    payment_status TEXT DEFAULT 'not_expected' REFERENCES payment_statuses(status),
    paid_amount DECIMAL(10, 2),
    payment_date DATE,
    payment_method TEXT,
    payment_reference TEXT,
    
    -- System
    conflict_status TEXT CHECK (conflict_status IN ('available', 'tight', 'unavailable', 'unknown')),
    conflict_reason TEXT,
    data_quality_status TEXT DEFAULT 'complete',
    duplicate_group_id UUID,
    google_calendar_event_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

-- Fixture Sources (link fixtures to source records)
CREATE TABLE fixture_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    source_record_id UUID NOT NULL REFERENCES source_records(id) ON DELETE CASCADE,
    link_type TEXT DEFAULT 'primary' CHECK (link_type IN ('primary', 'duplicate', 'cross_source')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fixture_id, source_record_id)
);

-- Fixture Assignments
CREATE TABLE fixture_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    response TEXT CHECK (response IN ('accepted', 'declined', 'pending')),
    response_time TIMESTAMPTZ,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fixture_id, user_id)
);

-- ============================================
-- 11. TRAVEL ESTIMATES
-- ============================================
CREATE TABLE travel_estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    from_venue_id UUID REFERENCES venues(id),
    to_venue_id UUID REFERENCES venues(id),
    from_lat DECIMAL(10, 8) NOT NULL,
    from_lng DECIMAL(11, 8) NOT NULL,
    to_lat DECIMAL(10, 8) NOT NULL,
    to_lng DECIMAL(11, 8) NOT NULL,
    distance_miles DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    traffic_duration_minutes INTEGER,
    toll_info JSONB,
    route_link TEXT,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. CALENDAR LINKS
-- ============================================
CREATE TABLE calendar_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    google_event_id TEXT NOT NULL,
    google_calendar_id TEXT NOT NULL,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('synced', 'pending', 'error', 'removed')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fixture_id, google_calendar_id)
);

-- Calendar Busy Blocks
CREATE TABLE calendar_busy_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_calendar_id TEXT NOT NULL,
    google_event_id TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    summary TEXT,
    location TEXT,
    is_busy BOOLEAN DEFAULT true,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, google_event_id)
);

-- ============================================
-- 13. EXPENSES
-- ============================================
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expense_type TEXT NOT NULL CHECK (expense_type IN ('mileage', 'parking', 'toll', 'other')),
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    distance_miles DECIMAL(10, 2),
    receipt_url TEXT,
    incurred_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. PAYMENTS
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expected_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2),
    payment_status TEXT NOT NULL DEFAULT 'expected' REFERENCES payment_statuses(status),
    payment_date DATE,
    payment_method TEXT,
    payment_reference TEXT,
    source TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. CONFLICT CHECKS
-- ============================================
CREATE TABLE conflict_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fixture_id UUID NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('available', 'tight', 'unavailable', 'unknown')),
    reason TEXT,
    input_values JSONB DEFAULT '{}',
    override_reason TEXT,
    override_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type_id UUID NOT NULL REFERENCES notification_types(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels TEXT[] DEFAULT ARRAY['push'],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. REVIEW QUEUE
-- ============================================
CREATE TABLE review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('duplicate', 'low_confidence_email', 'missing_venue', 'unmatched_change', 'unclear_status', 'google_mirror_error')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
    fixture_id UUID REFERENCES fixtures(id) ON DELETE SET NULL,
    source_record_id UUID REFERENCES source_records(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. AUDIT LOG
-- ============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_fixtures_tenant_user ON fixtures(tenant_id, user_id);
CREATE INDEX idx_fixtures_kickoff ON fixtures(kickoff_start);
CREATE INDEX idx_fixtures_status ON fixtures(appointment_status);
CREATE INDEX idx_fixtures_duplicate ON fixtures(duplicate_group_id);
CREATE INDEX idx_source_records_connection ON source_records(source_connection_id);
CREATE INDEX idx_source_records_processed ON source_records(is_processed);
CREATE INDEX idx_calendar_links_fixture ON calendar_links(fixture_id);
CREATE INDEX idx_calendar_busy_user ON calendar_busy_blocks(user_id, start_time, end_time);
CREATE INDEX idx_expenses_fixture ON expenses(fixture_id);
CREATE INDEX idx_payments_fixture ON payments(fixture_id);
CREATE INDEX idx_conflict_checks_fixture ON conflict_checks(fixture_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, status);
CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX idx_travel_estimate_venues ON travel_estimates(from_venue_id, to_venue_id);
CREATE INDEX idx_travel_estimate_coords ON travel_estimates(from_lat, from_lng, to_lat, to_lng);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrival_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixture_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_busy_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Tenants: users can read their own tenant
CREATE POLICY tenant_isolation ON tenants
    FOR ALL USING (id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Users: users can read/update their own record
CREATE POLICY user_isolation ON users
    FOR ALL USING (id = auth.uid() OR tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- User Settings: own settings only
CREATE POLICY user_settings_isolation ON user_settings
    FOR ALL USING (user_id = auth.uid());

-- Fixtures: tenant isolation
CREATE POLICY fixture_tenant_isolation ON fixtures
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Venues: tenant isolation
CREATE POLICY venue_tenant_isolation ON venues
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Source Connections: user isolation
CREATE POLICY source_connection_user_isolation ON source_connections
    FOR ALL USING (user_id = auth.uid());

-- Source Records: tenant isolation via connection
CREATE POLICY source_record_tenant_isolation ON source_records
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Expenses: user isolation
CREATE POLICY expense_user_isolation ON expenses
    FOR ALL USING (user_id = auth.uid());

-- Payments: user isolation
CREATE POLICY payment_user_isolation ON payments
    FOR ALL USING (user_id = auth.uid());

-- Calendar links: tenant isolation
CREATE POLICY calendar_link_tenant_isolation ON calendar_links
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Calendar busy blocks: user isolation
CREATE POLICY calendar_busy_user_isolation ON calendar_busy_blocks
    FOR ALL USING (user_id = auth.uid());

-- Conflict checks: user isolation
CREATE POLICY conflict_check_user_isolation ON conflict_checks
    FOR ALL USING (user_id = auth.uid());

-- Notifications: user isolation
CREATE POLICY notification_user_isolation ON notifications
    FOR ALL USING (user_id = auth.uid());

-- Review queue: tenant isolation
CREATE POLICY review_queue_tenant_isolation ON review_queue
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Audit log: tenant isolation
CREATE POLICY audit_log_tenant_isolation ON audit_log
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixtures_updated_at BEFORE UPDATE ON fixtures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_source_connections_updated_at BEFORE UPDATE ON source_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_source_records_updated_at BEFORE UPDATE ON source_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_links_updated_at BEFORE UPDATE ON calendar_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fixture_assignments_updated_at BEFORE UPDATE ON fixture_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuration_values_updated_at BEFORE UPDATE ON configuration_values
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_rules_updated_at BEFORE UPDATE ON fee_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_arrival_rules_updated_at BEFORE UPDATE ON arrival_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    tenant_uuid UUID;
BEGIN
    -- Try to get tenant_id from the record
    BEGIN
        tenant_uuid := NEW.tenant_id;
    EXCEPTION WHEN OTHERS THEN
        tenant_uuid := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (tenant_id, table_name, record_id, action, new_values, changed_by)
        VALUES (tenant_uuid, TG_TABLE_NAME, NEW.id::TEXT, 'insert', row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (tenant_id, table_name, record_id, action, old_values, new_values, changed_by)
        VALUES (tenant_uuid, TG_TABLE_NAME, NEW.id::TEXT, 'update', row_to_json(OLD), row_to_json(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (tenant_id, table_name, record_id, action, old_values, changed_by)
        VALUES (tenant_uuid, TG_TABLE_NAME, OLD.id::TEXT, 'delete', row_to_json(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER fixtures_audit AFTER INSERT OR UPDATE OR DELETE ON fixtures
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER source_connections_audit AFTER INSERT OR UPDATE OR DELETE ON source_connections
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER expenses_audit AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER payments_audit AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
CREATE TRIGGER venues_audit AFTER INSERT OR UPDATE OR DELETE ON venues
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
