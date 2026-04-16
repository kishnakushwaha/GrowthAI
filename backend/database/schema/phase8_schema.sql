ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS ai_human_summary TEXT;
ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS has_instagram BOOLEAN DEFAULT false;
ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS has_linkedin BOOLEAN DEFAULT false;
