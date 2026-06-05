import 'dotenv/config';
import supabase from '../backend/supabaseClient.js';

async function inspect() {
  console.log("--- INSPECTING ENROLLMENTS ---");
  const { data: enrolls, error: enrollError } = await supabase
    .from('wa_enrollments')
    .select('*');
  
  if (enrollError) {
    console.error("Enrollment fetch error:", enrollError.message);
  } else {
    console.log(`Total active/paused enrollments: ${enrolls.length}`);
    enrolls.forEach(e => {
      console.log(`ID: ${e.id}, Phone: ${e.phone}, Biz Name: ${e.biz_name}, Status: ${e.status}, Current Step: ${e.current_step}, Next Run: ${e.next_run_at}`);
    });
  }

  console.log("\n--- INSPECTING SALON A & CLINIC B IN BUSINESSES ---");
  const { data: biz, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .or('place_name.ilike.%Test Salon A%,place_name.ilike.%Test Clinic B%,phone.ilike.%9310626657%,phone.ilike.%9999280335%');

  if (bizError) {
    console.error("Businesses fetch error:", bizError.message);
  } else {
    console.log(`Matching businesses count: ${biz.length}`);
    biz.forEach(b => {
      console.log(`ID: ${b.id}, Name: ${b.place_name}, Phone: ${b.phone}, Website: ${b.website}, Stage: ${b.outreach_stage}, Scraped At: ${b.scraped_at}`);
    });
  }

  console.log("\n--- INSPECTING PIPELINE LEADS ---");
  const { data: leads, error: leadsError } = await supabase
    .from('pipeline_leads')
    .select('*')
    .or('business_name.ilike.%Test Salon A%,business_name.ilike.%Test Clinic B%,phone.ilike.%9310626657%,phone.ilike.%9999280335%');

  if (leadsError) {
    console.error("Pipeline leads fetch error:", leadsError.message);
  } else {
    leads.forEach(l => {
      console.log(`ID: ${l.id}, Name: ${l.business_name}, Phone: ${l.phone}, Stage: ${l.stage}, Created: ${l.created_at}`);
    });
  }
  
  process.exit(0);
}

inspect();
