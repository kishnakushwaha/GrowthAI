-- Phase 7: Competitor Benchmark Engine Schema
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS rank_position INT,
  ADD COLUMN IF NOT EXISTS search_query TEXT,
  ADD COLUMN IF NOT EXISTS search_city TEXT;

CREATE TABLE IF NOT EXISTS competitor_gaps (
  id BIGSERIAL PRIMARY KEY,
  business_id INT8 REFERENCES businesses(id) ON DELETE CASCADE,
  search_query TEXT,
  search_city TEXT,
  avg_competitor_reviews FLOAT,
  avg_competitor_rating FLOAT,
  avg_competitor_speed FLOAT,
  review_gap FLOAT,
  rating_gap FLOAT,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, search_query, search_city)
);
