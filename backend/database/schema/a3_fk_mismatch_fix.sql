-- =============================================
-- A3: Fix FK Mismatch — Link pipeline_leads to businesses
-- Run this AFTER week2_migrations.sql
-- =============================================

-- Step 1: Add business_id column to pipeline_leads
ALTER TABLE pipeline_leads 
  ADD COLUMN IF NOT EXISTS business_id int8;

-- Step 2: Backfill existing records by matching on phone or business_name
UPDATE pipeline_leads pl
SET business_id = b.id
FROM businesses b
WHERE pl.business_id IS NULL
  AND (
    (pl.phone IS NOT NULL AND pl.phone != '' AND pl.phone = b.phone)
    OR (pl.business_name = b.place_name)
  );

-- Step 3: Create index on business_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_pipeline_leads_business_id ON pipeline_leads(business_id);

-- Verify: Show how many were linked
SELECT 
  COUNT(*) as total_pipeline_leads,
  COUNT(business_id) as linked_to_businesses,
  COUNT(*) - COUNT(business_id) as unlinked
FROM pipeline_leads;
