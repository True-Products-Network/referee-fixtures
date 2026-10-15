-- Add Google Calendar OAuth tokens to users table
-- Required for Google Calendar sync feature

ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_calendar_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_token_expiry TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN users.google_calendar_access_token IS 'Google Calendar OAuth access token';
COMMENT ON COLUMN users.google_calendar_refresh_token IS 'Google Calendar OAuth refresh token (for offline access)';
COMMENT ON COLUMN users.google_calendar_token_expiry IS 'When the access token expires';
