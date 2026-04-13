const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/../backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkData() {
  const { data, error } = await supabase.from('website_enrichment').select('*').limit(5);
  if (error) console.error("Error:", error);
  else console.log("Rows:", data);
}

checkData();
