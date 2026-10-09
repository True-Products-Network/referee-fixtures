-- ============================================
-- Fix upsert constraint for fixtures
-- ============================================

-- Drop the partial index that doesn't work with ON CONFLICT
DROP INDEX IF EXISTS idx_fixtures_source_record;

-- Add a proper unique constraint on source_record_id (allowing NULLs via COALESCE)
-- We use COALESCE to handle NULLs since multiple NULLs are allowed under unique constraint
ALTER TABLE fixtures 
ADD CONSTRAINT fixtures_source_record_unique 
UNIQUE (source_record_id);
