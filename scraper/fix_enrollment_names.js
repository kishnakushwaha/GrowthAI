import 'dotenv/config';
import supabase from '../backend/supabaseClient.js';

function sanitizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

async function fixNames() {
  console.log("Restoring business names in wa_enrollments...");

  // 1. Fetch enrollments
  const { data: enrolls, error: enrollError } = await supabase
    .from('wa_enrollments')
    .select('*');

  if (enrollError) {
    console.error("Failed to fetch enrollments:", enrollError.message);
    return;
  }

  // 2. Fetch businesses to match names
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('phone, place_name')
    .not('place_name', 'is', null);

  if (bizError) {
    console.error("Failed to fetch businesses:", bizError.message);
    return;
  }

  // Create a map of cleanPhone -> place_name
  const bizMap = new Map();
  for (const b of businesses) {
    const cleanPhone = sanitizePhone(b.phone);
    if (cleanPhone) {
      // Keep the first one, or if we have multiple, just use the first non-null name
      if (!bizMap.has(cleanPhone) || !bizMap.get(cleanPhone)) {
        bizMap.set(cleanPhone, b.place_name);
      }
    }
  }

  // Also map from pipeline_leads as fallback
  const { data: leads } = await supabase.from('pipeline_leads').select('phone, business_name');
  if (leads) {
    for (const l of leads) {
      const cleanPhone = sanitizePhone(l.phone);
      if (cleanPhone && !bizMap.get(cleanPhone)) {
        bizMap.set(cleanPhone, l.business_name);
      }
    }
  }

  let updatedCount = 0;
  for (const e of enrolls) {
    const cleanPhone = sanitizePhone(e.phone);
    const correctName = bizMap.get(cleanPhone);
    
    // If the name is null/empty or is literally "null" or "Team" and we have a better name
    const needsFix = !e.biz_name || e.biz_name === 'null' || e.biz_name.trim() === '';
    
    if (needsFix && correctName) {
      console.log(`Fixing enrollment ID ${e.id} (${e.phone}): Setting name to "${correctName}" (was "${e.biz_name}")`);
      const { error: updError } = await supabase
        .from('wa_enrollments')
        .update({ biz_name: correctName })
        .eq('id', e.id);
        
      if (updError) {
        console.error(`Failed to update ID ${e.id}:`, updError.message);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully restored names for ${updatedCount} enrollments.`);
  process.exit(0);
}

fixNames();
