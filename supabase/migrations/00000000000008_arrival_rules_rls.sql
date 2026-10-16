-- ============================================
-- Add RLS policy for arrival_rules table
-- ============================================

-- Enable RLS (if not already enabled)
ALTER TABLE arrival_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS arrival_rules_tenant_isolation ON arrival_rules;

-- Create policy: users can only access arrival_rules for their tenant
CREATE POLICY arrival_rules_tenant_isolation ON arrival_rules
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Also add College and Pro competition types if needed
-- (These will be available in the UI dropdown)
