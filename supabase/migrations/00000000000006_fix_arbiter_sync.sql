-- ============================================
-- Fix Arbiter sync issues
-- ============================================

-- 1. Ensure source_record_id has a proper unique constraint for upsert
-- Drop any existing partial index that might interfere
DROP INDEX IF EXISTS idx_fixtures_source_record;

-- Add proper unique constraint (idempotent)
ALTER TABLE fixtures 
DROP CONSTRAINT IF EXISTS fixtures_source_record_unique;

ALTER TABLE fixtures 
ADD CONSTRAINT fixtures_source_record_unique 
UNIQUE (source_record_id);

-- 2. Add index on user_id + kickoff_start for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_fixtures_user_kickoff ON fixtures(user_id, kickoff_start);

-- 3. Add index on source_name for filtering
CREATE INDEX IF NOT EXISTS idx_fixtures_source_name ON fixtures(source_name);

-- 4. Ensure appointment_status 'confirmed' exists
INSERT INTO appointment_statuses (status, label, description, color, google_calendar_action, sort_order) 
VALUES ('confirmed', 'Confirmed', 'Appointment is confirmed by the source', '#16a34a', 'create', 3)
ON CONFLICT (status) DO NOTHING;
