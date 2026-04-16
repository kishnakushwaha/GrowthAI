// Fix Supabase RLS + Add Missing Columns for Phase 6
// Run: node fix_phase6.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fixPhase6() {
  console.log('🔧 Phase 6 Database Fix Script');
  console.log('================================\n');

  // Step 1: Test if we can INSERT into website_enrichment
  console.log('1️⃣ Testing website_enrichment insert...');
  const { data: testData, error: testError } = await supabase
    .from('website_enrichment')
    .insert({ lead_id: 999999, ai_first_line: 'test', cms_stack: 'test' })
    .select();
  
  if (testError) {
    console.log(`   ❌ INSERT BLOCKED: ${testError.message}`);
    console.log('   ⚠️  RLS is active on website_enrichment and blocking inserts!');
    console.log('\n   ========================================');
    console.log('   🚨 YOU MUST RUN THIS SQL IN SUPABASE:');
    console.log('   ========================================\n');
    console.log(`
-- STEP 1: Disable RLS on website_enrichment (allows Python scraper to insert)
ALTER TABLE website_enrichment DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS, add a permissive policy:
-- CREATE POLICY "Allow all inserts" ON website_enrichment FOR ALL USING (true) WITH CHECK (true);

-- STEP 2: Add Phase 6 columns
ALTER TABLE website_enrichment
  ADD COLUMN IF NOT EXISTS title_quality       text,
  ADD COLUMN IF NOT EXISTS page_title          text,
  ADD COLUMN IF NOT EXISTS pagespeed_mobile    int,
  ADD COLUMN IF NOT EXISTS pagespeed_desktop   int,
  ADD COLUMN IF NOT EXISTS resource_count      int,
  ADD COLUMN IF NOT EXISTS is_slow_site        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_ssl             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_schema_markup   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_score           int,
  ADD COLUMN IF NOT EXISTS opportunity_type    text,
  ADD COLUMN IF NOT EXISTS pitch_angle         text;
`);
  } else {
    console.log('   ✅ INSERT works! Cleaning up test row...');
    await supabase.from('website_enrichment').delete().eq('lead_id', 999999);
    
    // Test Phase 6 columns
    console.log('\n2️⃣ Testing Phase 6 columns...');
    const { error: colError } = await supabase
      .from('website_enrichment')
      .insert({ lead_id: 999998, ai_first_line: 'test', cms_stack: 'test', seo_score: 5, opportunity_type: 'no_tracking' })
      .select();
    
    if (colError) {
      console.log(`   ❌ Phase 6 columns missing: ${colError.message}`);
      console.log('\n   Run this SQL in Supabase:\n');
      console.log(`
ALTER TABLE website_enrichment
  ADD COLUMN IF NOT EXISTS title_quality       text,
  ADD COLUMN IF NOT EXISTS page_title          text,
  ADD COLUMN IF NOT EXISTS pagespeed_mobile    int,
  ADD COLUMN IF NOT EXISTS pagespeed_desktop   int,
  ADD COLUMN IF NOT EXISTS resource_count      int,
  ADD COLUMN IF NOT EXISTS is_slow_site        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_ssl             boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_schema_markup   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_score           int,
  ADD COLUMN IF NOT EXISTS opportunity_type    text,
  ADD COLUMN IF NOT EXISTS pitch_angle         text;
`);
    } else {
      console.log('   ✅ Phase 6 columns exist! Cleaning up...');
      await supabase.from('website_enrichment').delete().eq('lead_id', 999998);
    }
  }
  
  // Step 3: Check existing enrichment data
  console.log('\n3️⃣ Checking existing enrichment data...');
  const { data: enrichData } = await supabase.from('website_enrichment').select('*').limit(5);
  console.log(`   Found ${enrichData?.length || 0} enrichment rows total.`);
  
  // Step 4: Check businesses with lead_score
  console.log('\n4️⃣ Checking businesses lead_score...');
  const { data: bizData } = await supabase
    .from('businesses')
    .select('place_name, lead_score, phone, website')
    .order('id', { ascending: false })
    .limit(5);
  
  if (bizData) {
    for (const b of bizData) {
      console.log(`   ${b.place_name} | Score: ${b.lead_score} | Phone: ${b.phone ? '✅' : '❌'} | Web: ${b.website && b.website !== 'N/A' ? '✅' : '❌'}`);
    }
  }

  console.log('\n================================');
  console.log('🏁 Diagnosis complete!');
}

fixPhase6().catch(console.error);
