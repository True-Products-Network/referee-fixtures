-- ============================================
-- Rate Table for automatic fee assignment
-- ============================================

CREATE TABLE IF NOT EXISTS rate_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    competition_type TEXT NOT NULL,
    role TEXT NOT NULL,
    fee_amount DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, competition_type, role)
);

-- Enable RLS
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS rate_cards_tenant_isolation ON rate_cards;

-- Create policy
CREATE POLICY rate_cards_tenant_isolation ON rate_cards
    FOR ALL USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_cards_tenant ON rate_cards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_cards_lookup ON rate_cards(tenant_id, competition_type, role);
