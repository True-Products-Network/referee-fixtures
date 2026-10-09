-- Fix infinite recursion in users RLS policy
-- The issue: user_isolation policy references users table inside its own policy

-- Drop the problematic policy
DROP POLICY IF EXISTS user_isolation ON users;

-- Create a simpler policy that doesn't cause recursion
-- Users can read/update their own record
CREATE POLICY user_isolation ON users
    FOR ALL USING (id = auth.uid());

-- If you need admin access to all users in a tenant, create a separate policy
-- This requires the admin check to not reference the users table
-- CREATE POLICY user_admin_isolation ON users
--     FOR ALL USING (
--         role = 'admin' AND tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
--     );
