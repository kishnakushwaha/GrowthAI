-- ==========================================
-- GrowthAI Phase 1: Database Scaffolding
-- Paste this script into your Supabase SQL Editor
-- ==========================================

-- 1. Create OUTREACH LOG table
-- Tracks every WhatsApp and Email scheduled, sent, or replied to.
CREATE TABLE outreach_log (
    id SERIAL PRIMARY KEY,
    lead_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
    channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email')),
    template_used TEXT,
    status TEXT NOT NULL DEFAULT 'enqueued' CHECK (status IN ('enqueued', 'sent', 'replied', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reply_detected_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- Index for lightning-fast Kanban dashboard queries
CREATE INDEX idx_outreach_lead_id ON outreach_log(lead_id);
CREATE INDEX idx_outreach_status ON outreach_log(status);


-- 2. Create SCRAPE JOBS table
-- Replaces synchronous API calls with a safe, async job queue.
CREATE TABLE scrape_jobs (
    id SERIAL PRIMARY KEY,
    query TEXT NOT NULL,
    target_count INT DEFAULT 50,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_log TEXT,
    leads_found INT DEFAULT 0,
    agency_id UUID
);

CREATE INDEX idx_scrape_jobs_status ON scrape_jobs(status);


-- 3. Create WEBSITE ENRICHMENT table
-- Stores deep Website extraction details (Emails, Founders, Pixels, SEO flags).
CREATE TABLE website_enrichment (
    id SERIAL PRIMARY KEY,
    lead_id BIGINT UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,
    extracted_email TEXT,
    founder_name TEXT,
    has_fb_pixel BOOLEAN DEFAULT FALSE,
    has_google_ads BOOLEAN DEFAULT FALSE,
    seo_missing_h1 BOOLEAN DEFAULT FALSE,
    seo_missing_meta_desc BOOLEAN DEFAULT FALSE,
    cms_stack TEXT, -- e.g., 'WordPress', 'Shopify'
    ai_first_line TEXT, -- The Gemini-generated icebreaker
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for finding fully enriched leads
CREATE INDEX idx_enrichment_lead_id ON website_enrichment(lead_id);


-- 4. Add Lead Score column to current businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS lead_score INT DEFAULT 0;

-- Optionally index it immediately since you'll filter heavily by score
CREATE INDEX IF NOT EXISTS idx_businesses_lead_score ON businesses(lead_score DESC);

-- ==========================================
-- Done! Run this in Supabase!
-- ==========================================
