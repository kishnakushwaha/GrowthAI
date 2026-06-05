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

async function clean() {
  console.log("Starting DB phone cleanup and deduplication...");

  // 1. Clean wa_enrollments
  console.log("\n--- Cleaning wa_enrollments ---");
  const { data: enrollments, error: enrollError } = await supabase
    .from('wa_enrollments')
    .select('*');

  if (enrollError) {
    console.error("Failed to fetch enrollments:", enrollError.message);
    return;
  }

  const enrollMap = new Map();
  const toDeleteEnrollIds = [];
  const toUpdateEnrollments = [];

  for (const e of enrollments) {
    const cleanPhone = sanitizePhone(e.phone);
    if (!cleanPhone) {
      console.log(`Deleting enrollment ${e.id} because it has no valid phone: "${e.phone}"`);
      toDeleteEnrollIds.push(e.id);
      continue;
    }

    if (enrollMap.has(cleanPhone)) {
      const existing = enrollMap.get(cleanPhone);
      // Keep the one with a valid biz_name, or the one that is active, or the oldest one
      let keep = existing;
      let discard = e;

      if (!existing.biz_name && e.biz_name) {
        keep = e;
        discard = existing;
      } else if (existing.status !== 'active' && e.status === 'active') {
        keep = e;
        discard = existing;
      } else if (new Date(existing.created_at || 0) > new Date(e.created_at || 0)) {
        // Keep the older one if both are similar
        keep = e;
        discard = existing;
      }

      console.log(`Duplicate found for phone ${cleanPhone}. Keeping ID ${keep.id} (${keep.biz_name}), deleting ID ${discard.id} (${discard.biz_name})`);
      toDeleteEnrollIds.push(discard.id);
      enrollMap.set(cleanPhone, keep);
    } else {
      enrollMap.set(cleanPhone, e);
    }
  }

  // Update remaining enrollments to have the clean phone number format
  for (const [cleanPhone, e] of enrollMap.entries()) {
    if (e.phone !== cleanPhone) {
      toUpdateEnrollments.push({ id: e.id, phone: cleanPhone });
    }
  }

  // Execute deletes
  if (toDeleteEnrollIds.length > 0) {
    console.log(`Deleting ${toDeleteEnrollIds.length} duplicate enrollments...`);
    const { error: delError } = await supabase
      .from('wa_enrollments')
      .delete()
      .in('id', toDeleteEnrollIds);
    if (delError) console.error("Deletion error:", delError.message);
    else console.log("Successfully deleted duplicate enrollments.");
  }

  // Execute updates
  if (toUpdateEnrollments.length > 0) {
    console.log(`Updating ${toUpdateEnrollments.length} enrollments to clean phone format...`);
    for (const item of toUpdateEnrollments) {
      const { error: updError } = await supabase
        .from('wa_enrollments')
        .update({ phone: item.phone })
        .eq('id', item.id);
      if (updError) console.error(`Failed to update enrollment ID ${item.id}:`, updError.message);
    }
    console.log("Completed enrollment updates.");
  }

  // 2. Clean businesses table
  console.log("\n--- Cleaning businesses ---");
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, place_name, phone, outreach_stage');

  if (bizError) {
    console.error("Failed to fetch businesses:", bizError.message);
    return;
  }

  const bizMap = new Map();
  const toUpdateBusinesses = [];

  for (const b of businesses) {
    const cleanPhone = sanitizePhone(b.phone);
    if (!cleanPhone) continue;

    if (bizMap.has(cleanPhone)) {
      const existing = bizMap.get(cleanPhone);
      // Mark as duplicate in databases
      if (b.outreach_stage !== 'duplicate') {
        toUpdateBusinesses.push({ id: b.id, outreach_stage: 'duplicate', phone: cleanPhone });
      }
    } else {
      bizMap.set(cleanPhone, b);
      if (b.phone !== cleanPhone) {
        toUpdateBusinesses.push({ id: b.id, outreach_stage: b.outreach_stage, phone: cleanPhone });
      }
    }
  }

  if (toUpdateBusinesses.length > 0) {
    console.log(`Updating ${toUpdateBusinesses.length} business records (formatting/marking duplicate)...`);
    for (const item of toUpdateBusinesses) {
      const { error: updError } = await supabase
        .from('businesses')
        .update({ phone: item.phone, outreach_stage: item.outreach_stage })
        .eq('id', item.id);
      if (updError) console.error(`Failed to update business ID ${item.id}:`, updError.message);
    }
    console.log("Completed business updates.");
  }

  // 3. Clean pipeline_leads table
  console.log("\n--- Cleaning pipeline_leads ---");
  const { data: leads, error: leadsError } = await supabase
    .from('pipeline_leads')
    .select('id, business_name, phone, stage');

  if (leadsError) {
    console.error("Failed to fetch pipeline leads:", leadsError.message);
    return;
  }

  const leadsMap = new Map();
  const toDeleteLeads = [];
  const toUpdateLeads = [];

  for (const l of leads) {
    const cleanPhone = sanitizePhone(l.phone);
    if (!cleanPhone) continue;

    if (leadsMap.has(cleanPhone)) {
      const existing = leadsMap.get(cleanPhone);
      // Keep the one that is progressed further (e.g. stage is not 'new'), otherwise keep the oldest
      let keep = existing;
      let discard = l;

      if (existing.stage === 'new' && l.stage !== 'new') {
        keep = l;
        discard = existing;
      }
      
      console.log(`Duplicate CRM lead found for phone ${cleanPhone}. Keeping ID ${keep.id} (${keep.business_name}), deleting ID ${discard.id} (${discard.business_name})`);
      toDeleteLeads.push(discard.id);
      leadsMap.set(cleanPhone, keep);
    } else {
      leadsMap.set(cleanPhone, l);
    }
  }

  // Execute deletes for CRM leads
  if (toDeleteLeads.length > 0) {
    console.log(`Deleting ${toDeleteLeads.length} duplicate CRM leads...`);
    const { error: delError } = await supabase
      .from('pipeline_leads')
      .delete()
      .in('id', toDeleteLeads);
    if (delError) console.error("CRM deletion error:", delError.message);
    else console.log("Successfully deleted duplicate CRM leads.");
  }

  // Update remaining CRM leads to clean phone format
  for (const [cleanPhone, l] of leadsMap.entries()) {
    if (l.phone !== cleanPhone) {
      toUpdateLeads.push({ id: l.id, phone: cleanPhone });
    }
  }

  if (toUpdateLeads.length > 0) {
    console.log(`Updating ${toUpdateLeads.length} CRM leads to clean phone format...`);
    for (const item of toUpdateLeads) {
      const { error: updError } = await supabase
        .from('pipeline_leads')
        .update({ phone: item.phone })
        .eq('id', item.id);
      if (updError) console.error(`Failed to update CRM lead ID ${item.id}:`, updError.message);
    }
    console.log("Completed CRM lead updates.");
  }

  console.log("\nCleanup successfully completed!");
  process.exit(0);
}

clean();
