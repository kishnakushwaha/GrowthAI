-- Week 7 Migration: Prevent duplicate outreach to same phone number
-- Run in Supabase SQL Editor
-- ================================================================

-- 1. Remove duplicate phone entries in wa_enrollments (keep the oldest one)
DELETE FROM wa_enrollments
WHERE id NOT IN (
  SELECT MIN(id) FROM wa_enrollments GROUP BY phone
);

-- 2. Add UNIQUE constraint on phone column to prevent future duplicates
-- This is required for the upsert({ onConflict: 'phone' }) in agenticLoop.js
ALTER TABLE wa_enrollments
  DROP CONSTRAINT IF EXISTS wa_enrollments_phone_unique;
ALTER TABLE wa_enrollments
  ADD CONSTRAINT wa_enrollments_phone_unique UNIQUE (phone);

-- 3. Index on wa_enrollments.phone for fast dedup lookups
CREATE INDEX IF NOT EXISTS idx_wa_enrollments_phone ON wa_enrollments(phone);

-- 4. Index on businesses.phone for cross-business dedup checks
CREATE INDEX IF NOT EXISTS idx_businesses_phone ON businesses(phone);

-- 5. Mark existing duplicate-phone businesses as 'duplicate'
-- For each phone number with multiple rows, keep the earliest row and mark the rest
UPDATE businesses b
SET outreach_stage = 'duplicate'
WHERE b.id NOT IN (
  SELECT MIN(b2.id)
  FROM businesses b2
  WHERE b2.phone IS NOT NULL
  GROUP BY REGEXP_REPLACE(b2.phone, '[^0-9]', '', 'g')
)
AND b.outreach_stage IS NULL
AND b.phone IS NOT NULL
AND EXISTS (
  SELECT 1
  FROM businesses b3
  WHERE b3.id < b.id
  AND REGEXP_REPLACE(b3.phone, '[^0-9]', '', 'g') = REGEXP_REPLACE(b.phone, '[^0-9]', '', 'g')
);
