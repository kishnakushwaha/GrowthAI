-- A9: Add sub-score columns to businesses table
-- Run in Supabase SQL Editor

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS score_website int2 DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS score_reviews int2 DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS score_rating int2 DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS score_presence int2 DEFAULT 0;

-- F7: Add A/B test variant column to sequence_steps
ALTER TABLE sequence_steps ADD COLUMN IF NOT EXISTS variant text DEFAULT 'A';
ALTER TABLE campaign_leads ADD COLUMN IF NOT EXISTS variant text DEFAULT 'A';

SELECT 'Migration complete: A9 sub-scores + F7 A/B variant + F5 competitor benchmarks added' as status;

-- F5: Add competitor benchmark columns to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS comp_avg_rating float4 DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS comp_avg_reviews int4 DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS comp_website_pct int2 DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS comp_top_3 text DEFAULT '';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS comp_review_gap int4 DEFAULT 0;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS comp_rating_gap float4 DEFAULT 0;

-- F1: Contact identity extraction
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS contact_name text;

CREATE TABLE IF NOT EXISTS contacts (
  id bigserial PRIMARY KEY,
  business_id bigint REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text DEFAULT 'Unknown',
  email text,
  phone text,
  linkedin_url text,
  source text DEFAULT 'website_scrape',
  created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, name)
);

CREATE INDEX IF NOT EXISTS idx_contacts_business ON contacts(business_id);

SELECT 'All week5 migrations complete' as status;
