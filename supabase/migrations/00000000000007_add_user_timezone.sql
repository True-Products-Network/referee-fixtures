-- ============================================
-- Add timezone column to users table
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago';

-- Update existing users to have a default timezone
UPDATE users 
SET timezone = 'America/Chicago' 
WHERE timezone IS NULL;
