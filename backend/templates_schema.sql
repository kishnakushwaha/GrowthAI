-- Phase 6.7 Schema for Outreach Templates
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  opportunity_type TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Ensure you run this inside the Supabase SQL editor.
