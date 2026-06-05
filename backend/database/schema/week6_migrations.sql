-- Migration to add outreach_stage column and get_saturated_combos RPC function
-- Run in Supabase SQL Editor

-- 1. Add outreach_stage column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS outreach_stage text;

-- 2. Create index on outreach_stage to speed up agentic loop queries
CREATE INDEX IF NOT EXISTS idx_businesses_outreach_stage ON businesses(outreach_stage);

-- 3. Add has_chatbot column to website_enrichment table
ALTER TABLE website_enrichment ADD COLUMN IF NOT EXISTS has_chatbot BOOLEAN DEFAULT FALSE;

-- 4. Create RPC function for saturated combos (industry+city with 20+ leads)
CREATE OR REPLACE FUNCTION get_saturated_combos()
RETURNS TABLE (
  industry text,
  city text,
  lead_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(b.industry, 'unknown') as industry,
    COALESCE(b.city, 'unknown') as city,
    COUNT(*) as lead_count
  FROM 
    businesses b
  GROUP BY 
    b.industry, 
    b.city
  HAVING 
    COUNT(*) >= 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
