-- ============================================
-- Referee Fixture Hub - Seed Data
-- ============================================

-- ============================================
-- 1. SEED TENANT (Personal use)
-- ============================================
INSERT INTO tenants (id, name, slug, plan_name) VALUES
('00000000-0000-0000-0000-000000000001', 'Personal', 'personal', 'personal');

-- ============================================
-- 2. SEED APPOINTMENT STATUSES
-- ============================================
INSERT INTO appointment_statuses (status, label, description, color, google_calendar_action, sort_order) VALUES
('offered', 'Offered', 'Appointment received but no decision recorded', '#3b82f6', 'none', 1),
('accepted', 'Accepted', 'Referee accepted the appointment', '#22c55e', 'create', 2),
('confirmed', 'Confirmed', 'Appointment is confirmed by the source', '#16a34a', 'create', 3),
('change_pending', 'Change Pending', 'Source changed a material detail and a new response may be needed', '#f59e0b', 'update', 4),
('declined', 'Declined', 'Referee declined', '#6b7280', 'remove', 5),
('completed', 'Completed', 'Match took place', '#15803d', 'none', 6),
('cancelled', 'Cancelled', 'Match was cancelled', '#9ca3af', 'cancel', 7),
('abandoned', 'Abandoned', 'Match started but did not finish', '#d97706', 'none', 8),
('no_show', 'No-show / Reassigned', 'Referee no longer worked the fixture', '#ef4444', 'remove', 9);

-- ============================================
-- 3. SEED PAYMENT STATUSES
-- ============================================
INSERT INTO payment_statuses (status, label, description, sort_order) VALUES
('not_expected', 'Not Expected', 'No payment expected for this fixture', 1),
('expected', 'Expected', 'Payment is expected', 2),
('submitted', 'Submitted', 'Invoice or payment request submitted', 3),
('processing', 'Processing', 'Payment is being processed', 4),
('partially_paid', 'Partially Paid', 'Partial payment received', 5),
('paid', 'Paid', 'Full payment received', 6),
('overdue', 'Overdue', 'Payment is overdue', 7),
('disputed', 'Disputed', 'Payment is under dispute', 8),
('waived', 'Waived', 'Payment waived', 9);

-- ============================================
-- 4. SEED FIXTURE ROLES
-- ============================================
INSERT INTO fixture_roles (role, label, description, sort_order) VALUES
('referee', 'Referee', 'Center referee', 1),
('ar1', 'AR1', 'Assistant referee 1', 2),
('ar2', 'AR2', 'Assistant referee 2', 3),
('fourth_official', 'Fourth Official', 'Fourth official', 4),
('mentor', 'Mentor', 'Mentor observer', 5),
('assessor', 'Assessor', 'Match assessor', 6),
('var', 'VAR', 'Video assistant referee', 7),
('other', 'Other', 'Other role', 8);

-- ============================================
-- 5. SEED SOURCE DEFINITIONS
-- ============================================
INSERT INTO source_definitions (name, label, adapter_type, capabilities, sort_order) VALUES
('assignr', 'Assignr', 'ical', ARRAY['read','ical_feed'], 1),
('arbiter', 'ArbiterSports', 'ical', ARRAY['read','ical_feed'], 2),
('eventlink', 'EventLink', 'ical', ARRAY['read','ical_feed'], 3),
('refquest', 'RefQuest / RQ+', 'email', ARRAY['read','email'], 4),
('refr_sports', 'Refr Sports', 'email', ARRAY['read','email'], 5),
('manual', 'Manual Entry', 'manual', ARRAY['read','write'], 6),
('csv_import', 'CSV Import', 'csv', ARRAY['read','bulk_import'], 7);

-- ============================================
-- 6. SEED NOTIFICATION TYPES
-- ============================================
INSERT INTO notification_types (event, label, description, default_channels, template_subject, template_body) VALUES
('new_fixture_offer', 'New Fixture Offer', 'A new fixture offer has been imported', ARRAY['push','email'], 
 'New Fixture Offer: {{home_team}} v {{away_team}}', 
 'You have a new fixture offer: {{home_team}} vs {{away_team}} on {{kickoff_date}} at {{kickoff_time}}.'),

('fixture_changed', 'Fixture Changed', 'A fixture has been changed after acceptance', ARRAY['push','email'],
 'Fixture Changed: {{home_team}} v {{away_team}}',
 'Your fixture {{home_team}} vs {{away_team}} has been changed. Please review the updated details.'),

('fixture_cancelled', 'Fixture Cancelled', 'A fixture has been cancelled', ARRAY['push','email'],
 'Fixture Cancelled: {{home_team}} v {{away_team}}',
 'Your fixture {{home_team}} vs {{away_team}} has been cancelled.'),

('conflict_detected', 'Conflict Detected', 'A direct time conflict was found', ARRAY['push'],
 'Conflict Detected',
 'A scheduling conflict was detected for {{home_team}} vs {{away_team}}.'),

('source_connection_failed', 'Source Connection Failed', 'A source connection failed repeatedly', ARRAY['push','email'],
 'Source Connection Failed: {{source_name}}',
 'The connection to {{source_name}} has failed. Please check your settings.'),

('google_sync_failed', 'Google Calendar Sync Failed', 'Google Calendar mirror failed', ARRAY['push'],
 'Google Calendar Sync Failed',
 'Failed to sync fixture to Google Calendar.'),

('response_deadline_approaching', 'Response Deadline Approaching', 'Offer response deadline is near', ARRAY['push'],
 'Deadline Approaching: {{home_team}} v {{away_team}}',
 'You have until {{deadline}} to respond to the offer for {{home_team}} vs {{away_team}}.'),

('departure_reminder', 'Departure Reminder', 'Time to leave for fixture', ARRAY['push'],
 'Time to Leave: {{home_team}} v {{away_team}}',
 'You should leave now to arrive on time for {{home_team}} vs {{away_team}}.'),

('payment_overdue', 'Payment Overdue', 'A payment is overdue', ARRAY['push','email'],
 'Payment Overdue: {{home_team}} v {{away_team}}',
 'Payment for {{home_team}} vs {{away_team}} is overdue.');

-- ============================================
-- 7. SEED FEATURE DEFINITIONS
-- ============================================
INSERT INTO feature_definitions (feature, label, description, config_requirements) VALUES
('source_connections', 'Source Connections', 'Connect to fixture sources', '{"max_sources": 5}'),
('ical_import', 'iCalendar Import', 'Import from iCalendar feeds', '{}'),
('email_import', 'Email Import', 'Import from forwarded emails', '{}'),
('csv_import', 'CSV Import', 'Bulk import from CSV files', '{}'),
('google_calendar_sync', 'Google Calendar Sync', 'Sync fixtures to Google Calendar', '{}'),
('conflict_check', 'Conflict Checking', 'Check for scheduling conflicts', '{}'),
('travel_calculation', 'Travel Calculation', 'Calculate travel time and distance', '{"max_routes_per_day": 50}'),
('earnings_tracking', 'Earnings Tracking', 'Track fees and payments', '{}'),
('expense_tracking', 'Expense Tracking', 'Track expenses and mileage', '{}'),
('review_queue', 'Review Queue', 'Review duplicates and low-confidence imports', '{}'),
('crew_sharing', 'Crew Calendar Sharing', 'Share calendar with crew members', '{}'),
('family_sharing', 'Family Calendar Sharing', 'Share calendar with family', '{}');

-- ============================================
-- 8. SEED PLAN ENTITLEMENTS
-- ============================================
INSERT INTO plan_entitlements (plan_name, feature_id, limit) 
SELECT 'personal', id, NULL FROM feature_definitions 
WHERE feature IN ('source_connections', 'ical_import', 'email_import', 'csv_import', 'google_calendar_sync', 'conflict_check', 'travel_calculation', 'earnings_tracking', 'expense_tracking', 'review_queue');

-- ============================================
-- 9. SEED CONFIGURATION DEFINITIONS
-- ============================================
INSERT INTO configuration_definitions (key, data_type, allowed_scopes, description, category) VALUES
('duplicate_time_window_minutes', 'number', ARRAY['global','tenant'], 'Time window for duplicate detection in minutes', 'duplicates'),
('duplicate_confidence_threshold', 'number', ARRAY['global','tenant'], 'Minimum confidence score for auto-linking duplicates', 'duplicates'),
('max_appointments_per_day', 'number', ARRAY['global','tenant','user'], 'Maximum appointments per day', 'limits'),
('max_driving_distance_per_day', 'number', ARRAY['global','tenant','user'], 'Maximum driving distance per day in miles', 'limits'),
('min_gap_between_matches_minutes', 'number', ARRAY['global','tenant','user'], 'Minimum gap between matches in minutes', 'limits'),
('rest_period_hours', 'number', ARRAY['global','tenant','user'], 'Required rest period between days in hours', 'limits'),
('feed_refresh_interval_minutes', 'number', ARRAY['global','tenant'], 'Default feed refresh interval in minutes', 'sync'),
('stale_feed_hours', 'number', ARRAY['global','tenant'], 'Hours before a feed is considered stale', 'sync'),
('max_retry_attempts', 'number', ARRAY['global','tenant'], 'Maximum retry attempts for failed syncs', 'sync'),
('google_mirror_time_block', 'string', ARRAY['global','tenant','user'], 'Time block for Google mirror: departure_to_finish or arrival_to_finish', 'calendar'),
('overdue_payment_days', 'number', ARRAY['global','tenant','user'], 'Days before payment is considered overdue', 'payments'),
('tax_year_mileage_rate', 'number', ARRAY['global','tenant'], 'Current tax year mileage rate', 'finance'),
('configuration_precedence_order', 'json', ARRAY['global'], 'Order of configuration resolution precedence', 'system');

-- ============================================
-- 10. SEED CONFIGURATION VALUES
-- ============================================
INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '30'::jsonb FROM configuration_definitions WHERE key = 'duplicate_time_window_minutes';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '0.85'::jsonb FROM configuration_definitions WHERE key = 'duplicate_confidence_threshold';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '3'::jsonb FROM configuration_definitions WHERE key = 'max_appointments_per_day';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '200'::jsonb FROM configuration_definitions WHERE key = 'max_driving_distance_per_day';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '30'::jsonb FROM configuration_definitions WHERE key = 'min_gap_between_matches_minutes';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '8'::jsonb FROM configuration_definitions WHERE key = 'rest_period_hours';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '60'::jsonb FROM configuration_definitions WHERE key = 'feed_refresh_interval_minutes';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '24'::jsonb FROM configuration_definitions WHERE key = 'stale_feed_hours';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '5'::jsonb FROM configuration_definitions WHERE key = 'max_retry_attempts';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '"departure_to_finish"'::jsonb FROM configuration_definitions WHERE key = 'google_mirror_time_block';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '30'::jsonb FROM configuration_definitions WHERE key = 'overdue_payment_days';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '0.67'::jsonb FROM configuration_definitions WHERE key = 'tax_year_mileage_rate';

INSERT INTO configuration_values (definition_id, scope_type, value) 
SELECT id, 'global', '["fixture","venue","competition_role","competition","source","user","tenant","global"]'::jsonb FROM configuration_definitions WHERE key = 'configuration_precedence_order';

-- ============================================
-- 11. SEED ARRIVAL RULES
-- ============================================
INSERT INTO arrival_rules (tenant_id, scope_type, competition_type, role, age_group, arrival_lead_minutes, parking_buffer_minutes, match_duration_minutes, post_match_buffer_minutes) VALUES
('00000000-0000-0000-0000-000000000001', 'tenant', 'youth_centre', 'referee', null, 45, 10, 70, 15),
('00000000-0000-0000-0000-000000000001', 'tenant', 'youth_centre', 'ar1', null, 30, 10, 70, 10),
('00000000-0000-0000-0000-000000000001', 'tenant', 'youth_centre', 'ar2', null, 30, 10, 70, 10),
('00000000-0000-0000-0000-000000000001', 'tenant', 'high_school', 'referee', null, 45, 10, 80, 15),
('00000000-0000-0000-0000-000000000001', 'tenant', 'high_school', 'ar1', null, 30, 10, 80, 10),
('00000000-0000-0000-0000-000000000001', 'tenant', 'high_school', 'ar2', null, 30, 10, 80, 10),
('00000000-0000-0000-0000-000000000001', 'tenant', 'mls_next', 'referee', null, 60, 15, 90, 20),
('00000000-0000-0000-0000-000000000001', 'tenant', 'mls_next', 'ar1', null, 45, 15, 90, 15),
('00000000-0000-0000-0000-000000000001', 'tenant', 'mls_next', 'ar2', null, 45, 15, 90, 15),
('00000000-0000-0000-0000-000000000001', 'tenant', 'tournament', 'referee', null, 45, 10, 70, 15),
('00000000-0000-0000-0000-000000000001', 'tenant', 'adult_amateur', 'referee', null, 45, 10, 90, 15);

-- ============================================
-- 12. SEED FEE RULES
-- ============================================
INSERT INTO fee_rules (tenant_id, scope_type, rule_type, rate_per_unit, unit_type) VALUES
('00000000-0000-0000-0000-000000000001', 'tenant', 'mileage_rate', 0.67, 'mile');
