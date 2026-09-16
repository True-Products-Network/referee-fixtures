-- Fix 1: Add RLS policy for source_definitions (allow all authenticated users to read)
CREATE POLICY IF NOT EXISTS source_definitions_read ON source_definitions FOR SELECT USING (true);

-- Fix 2: Check if your user exists in auth.users
SELECT id, email FROM auth.users LIMIT 5;

-- Fix 3: Insert your user into the users table if missing
-- Replace YOUR_USER_ID with your actual UUID from auth.users
-- INSERT INTO users (id, tenant_id, email, full_name, role)
-- VALUES ('YOUR_USER_ID', '00000000-0000-0000-0000-000000000001', 'your@email.com', 'Your Name', 'referee');
