-- ============================================
-- Fix fixture upsert and add date range support
-- ============================================

-- Add unique constraint on source_record_id for proper upsert behavior
CREATE UNIQUE INDEX idx_fixtures_source_record ON fixtures(source_record_id) 
WHERE source_record_id IS NOT NULL;

-- Also add index on user_id + kickoff_start for efficient date range queries
CREATE INDEX idx_fixtures_user_kickoff ON fixtures(user_id, kickoff_start);
