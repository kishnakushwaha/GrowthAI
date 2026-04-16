-- Phase 8: Automation & Sequential Outreach Schema

-- 1. Contacts Table (Decision Makers)
CREATE TABLE IF NOT EXISTS contacts (
  id               bigserial PRIMARY KEY,
  business_id      int8 REFERENCES businesses(id),
  name             text,
  email            text,
  phone            text,
  role             text,          -- 'owner' | 'manager' | 'marketing'
  source           text,          -- 'about_page' | 'schema'
  confidence       int DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

-- 2. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL,
  industry    text,
  description text,
  status      text DEFAULT 'draft',   -- 'draft' | 'active' | 'paused'
  created_at  timestamptz DEFAULT now()
);

-- 3. Sequence Steps
CREATE TABLE IF NOT EXISTS sequence_steps (
  id           bigserial PRIMARY KEY,
  campaign_id  int8 REFERENCES campaigns(id) ON DELETE CASCADE,
  day_offset   int DEFAULT 0,         -- 0 = immediately, 1 = day 2, etc.
  channel      text DEFAULT 'whatsapp',-- 'whatsapp' | 'email'
  template_body text,                 -- Template content with {{variables}}
  is_active    boolean DEFAULT true
);

-- 4. Enrollments
CREATE TABLE IF NOT EXISTS campaign_leads (
  id           bigserial PRIMARY KEY,
  campaign_id  int8 REFERENCES campaigns(id),
  lead_id      int8 REFERENCES businesses(id),
  status       text DEFAULT 'active',  -- 'active' | 'replied' | 'completed'
  current_step int DEFAULT 0,
  enrolled_at  timestamptz DEFAULT now(),
  UNIQUE(campaign_id, lead_id)
);

-- 5. Pending Outreach Queue
CREATE TABLE IF NOT EXISTS pending_outreach (
  id             bigserial PRIMARY KEY,
  lead_id        int8 REFERENCES businesses(id),
  campaign_id    int8 REFERENCES campaigns(id),
  step_id        int8 REFERENCES sequence_steps(id),
  channel        text,
  message_body   text,
  scheduled_for  timestamptz DEFAULT now(),
  status         text DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  created_at     timestamptz DEFAULT now()
);

-- Upgrade website_enrichment for Phase 8 data
ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS ai_human_summary TEXT;
ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS has_instagram BOOLEAN DEFAULT false;
ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS has_linkedin BOOLEAN DEFAULT false;
ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS owner_name TEXT;

CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_outreach(status);
CREATE INDEX IF NOT EXISTS idx_contact_biz ON contacts(business_id);
