-- Fix for empty source_definitions table
-- Run this in Supabase SQL Editor

-- 1. Insert source definitions if they don't exist
INSERT INTO source_definitions (name, label, adapter_type, capabilities, sort_order)
VALUES 
  ('assignr', 'Assignr', 'ical', ARRAY['read','ical_feed'], 1),
  ('arbiter', 'ArbiterSports', 'ical', ARRAY['read','ical_feed'], 2),
  ('eventlink', 'EventLink', 'ical', ARRAY['read','ical_feed'], 3),
  ('refquest', 'RefQuest / RQ+', 'email', ARRAY['read','email'], 4),
  ('refr_sports', 'Refr Sports', 'email', ARRAY['read','email'], 5),
  ('manual', 'Manual Entry', 'manual', ARRAY['read','write'], 6),
  ('csv_import', 'CSV Import', 'csv', ARRAY['read','bulk_import'], 7)
ON CONFLICT (name) DO NOTHING;

-- 2. Verify they were inserted
SELECT * FROM source_definitions ORDER BY sort_order;

-- 3. Update your user to have a tenant_id
-- Replace with your actual user ID from auth.users
-- UPDATE users SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE id = 'YOUR_USER_ID';

-- To find your user ID, run:
-- SELECT id, email FROM auth.users LIMIT 5;
