-- ============================================
-- Review Queue table to persist dismissed/resolved issues
-- ============================================

-- Create table if not exists
CREATE TABLE IF NOT EXISTS review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    fixture_id UUID NOT NULL,
    issue_type TEXT NOT NULL,
    issue_key TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'warning',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(tenant_id, issue_key)
);

-- Enable RLS
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists (safe to rerun)
DROP POLICY IF EXISTS review_queue_tenant_isolation ON review_queue;

-- Create policy
CREATE POLICY review_queue_tenant_isolation ON review_queue
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_review_queue_tenant_status ON review_queue(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_review_queue_issue_key ON review_queue(issue_key);
