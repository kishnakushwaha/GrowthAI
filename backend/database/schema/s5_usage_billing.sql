-- s5_usage_billing.sql
-- S5: Usage/Billing Telemetry and S3 GDPR Data Retention (Soft Delete)

-- 1. Create Usage Events table for SaaS Metered Billing
CREATE TABLE IF NOT EXISTS usage_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    event_type text NOT NULL, -- e.g., 'scrape_job', 'ai_rewrite', 'email_sent', 'wa_sent'
    quantity int DEFAULT 1,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Index for fast usage aggregations and billing queries
CREATE INDEX IF NOT EXISTS idx_usage_events_agency ON usage_events(agency_id, created_at);

-- 2. Add Soft Delete flag to Agencies (GDPR Retention - User Chose "Delete Nothing")
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 3. Add Soft Delete flag to Users to instantly revoke access upon deletion
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

SELECT 'S5 & S3 Migration Complete: Usage telemetry and Data Retention constraints applied.' as status;
