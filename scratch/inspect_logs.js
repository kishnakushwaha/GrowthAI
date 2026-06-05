import 'dotenv/config';
import supabase from '../backend/supabaseClient.js';

async function inspectLogs() {
  const phones = ['919310626657', '919999280335'];
  for (const phone of phones) {
    console.log(`\n=================== PHONE: ${phone} ===================`);
    
    console.log("--- wa_enrollments ---");
    const { data: enrolls } = await supabase
      .from('wa_enrollments')
      .select('*')
      .eq('phone', phone);
    console.log(enrolls);

    console.log("--- wa_logs ---");
    const { data: logs } = await supabase
      .from('wa_logs')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: true });
    console.log(logs);

    console.log("--- businesses with this phone ---");
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, place_name, phone, website, outreach_stage, scraped_at')
      .or(`phone.eq.${phone}`);
    console.log(biz);
  }
  process.exit(0);
}

inspectLogs();
