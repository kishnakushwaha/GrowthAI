import supabase from '../supabaseClient.js';
import { rewriteWithAI } from './geminiHelper.js';
import fetch from 'node-fetch';
import { isPaused } from './telegramBot.js';
import { importFromScraper } from './crmEngine.js';

function isValidWebsite(url) {
  if (!url) return false;
  const junk = ['n/a', 'na', 'none', 'null', '-', '–', 'no'];
  if (junk.includes(url.trim().toLowerCase())) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (url.length <= 10) return false;
  return true;
}

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

/**
 * PHASE 10: The Agentic Polling Loop
 * 100% Autonomous. No frontend triggering required.
 * 
 * 1. Checks for unprocessed leads.
 * 2. Checks if they have a website.
 *    - Has Website -> Triggers Pitch Generation
 *    - No Website -> Triggers Builder Agent Handoff (Placeholder) -> Pitch Generation
 * 3. Enqueues message to wa-service
 */

const WA_SERVICE_URL = 'http://localhost:4000/api/wa/send';

export async function runAgenticLoop(force = false) {
  if (isPaused) {
    console.log('[AGENT-LOOP] ⏸️ Loop is paused via Telegram. Skipping.');
    return;
  }

  // Working hours check (9:00 AM to 7:00 PM only) unless forced
  const tzOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false };
  const timeString = new Date().toLocaleTimeString('en-US', tzOptions);
  const [hours] = timeString.split(':').map(Number);
  
  if (!force && (hours >= 19 || hours < 9)) {
    console.log('[AGENT-LOOP] 🌙 Outside working hours (after 7:00 PM or before 9:00 AM Kolkata time). Skipping outreach.');
    return;
  }

  console.log('[AGENT-LOOP] 🤖 Waking up to process new leads...');

  try {
    // Auto-import any newly scraped leads into pipeline_leads first
    console.log('[AGENT-LOOP] 🔄 Syncing new scraper leads to CRM...');
    const imported = await importFromScraper().catch(e => {
      console.error('[AGENT-LOOP] ⚠️ Auto-import failed:', e.message);
      return 0;
    });
    if (imported > 0) {
      console.log(`[AGENT-LOOP] ✅ Imported ${imported} new leads into CRM.`);
    }

    // 1. Fetch leads that have been enriched but not yet pitched
    // We assume 'pipeline_leads' or 'campaign_leads' is populated by the scouting agent
    // For now, let's grab leads from 'businesses' that don't have an entry in 'outreach_log'
    // This is a simplified approach. In production, we'd use a dedicated 'agent_queue' table.
    
    // Fetch leads. Since businesses doesn't have a status column, 
    // we fetch recently added leads and limit it. In production, this should join against wa_enrollments to exclude them.
    const { data: newLeads, error } = await supabase
      .from('businesses')
      .select('id, place_name, phone, website, industry, search_city')
      .is('outreach_stage', null)
      .order('scraped_at', { ascending: false })
      .limit(5);

    if (error) {
      if (error.message && error.message.includes('outreach_stage')) {
        console.warn('\n⚠️ [DATABASE WARNING] The "outreach_stage" column is missing from the "businesses" table.');
        console.warn('⚠️ To fix this, please run the SQL migration file in your Supabase SQL Editor:');
        console.warn('⚠️ backend/database/schema/week6_migrations.sql\n');
        return;
      }
      throw error;
    }
    if (!newLeads || newLeads.length === 0) {
      console.log('[AGENT-LOOP] 💤 No new leads to process right now.');
      return;
    }

    console.log(`[AGENT-LOOP] 🎯 Found ${newLeads.length} new leads. Processing...`);

    // Track phones processed in THIS batch to prevent in-batch duplicates
    const processedPhones = new Set();

    for (const lead of newLeads) {
      // ── DUPLICATE PHONE DETECTION ──────────────────────────────
      const cleanedPhone = sanitizePhone(lead.phone);

      // Check 1: Invalid/empty phone
      if (!cleanedPhone || cleanedPhone.length < 10) {
        console.log(`[AGENT-LOOP] ⚠️ Lead ${lead.id} (${lead.place_name}) has invalid phone "${lead.phone}". Skipping.`);
        await supabase.from('businesses').update({ outreach_stage: 'invalid_phone' }).eq('id', lead.id);
        continue;
      }

      // Check 2: Already processed in this batch
      if (processedPhones.has(cleanedPhone)) {
        console.log(`[AGENT-LOOP] 🔁 Lead ${lead.id} (${lead.place_name}) phone ${cleanedPhone} already processed in this batch. Marking duplicate.`);
        await supabase.from('businesses').update({ outreach_stage: 'duplicate' }).eq('id', lead.id);
        continue;
      }

      // Check 3: Phone already exists in wa_enrollments (pitched in a previous run)
      const { data: existingEnrollment } = await supabase
        .from('wa_enrollments')
        .select('lead_id')
        .eq('phone', cleanedPhone)
        .maybeSingle();

      if (existingEnrollment) {
        console.log(`[AGENT-LOOP] 🔁 Lead ${lead.id} (${lead.place_name}) phone ${cleanedPhone} already enrolled (lead_id: ${existingEnrollment.lead_id}). Marking duplicate & contacted.`);
        await supabase.from('businesses').update({ outreach_stage: 'duplicate' }).eq('id', lead.id);
        // Mark as contacted in the CRM/Admin dashboard
        await supabase.from('pipeline_leads').update({ stage: 'contacted' }).or(`business_id.eq.${lead.id},phone.eq.${cleanedPhone}`);
        continue;
      }

      // Check 4: Another business row with same phone was already pitched
      const { data: alreadyPitched } = await supabase
        .from('businesses')
        .select('id, place_name, outreach_stage')
        .neq('id', lead.id)
        .not('outreach_stage', 'is', null)
        .or(`phone.eq.${lead.phone},phone.eq.${cleanedPhone}`)
        .limit(1);

      if (alreadyPitched && alreadyPitched.length > 0) {
        console.log(`[AGENT-LOOP] 🔁 Lead ${lead.id} (${lead.place_name}) shares phone with already-pitched lead ${alreadyPitched[0].id} (${alreadyPitched[0].place_name}). Marking duplicate & contacted.`);
        await supabase.from('businesses').update({ outreach_stage: 'duplicate' }).eq('id', lead.id);
        // Mark as contacted in the CRM/Admin dashboard
        await supabase.from('pipeline_leads').update({ stage: 'contacted' }).or(`business_id.eq.${lead.id},phone.eq.${cleanedPhone}`);
        continue;
      }

      // Check 5: Phone already exists in pipeline_leads with contacted/working/won/lost/negotiation stage
      const { data: existingCrmLead } = await supabase
        .from('pipeline_leads')
        .select('id, stage')
        .eq('phone', cleanedPhone)
        .neq('stage', 'new')
        .limit(1);

      if (existingCrmLead && existingCrmLead.length > 0) {
        console.log(`[AGENT-LOOP] 🔁 Lead ${lead.id} (${lead.place_name}) phone ${cleanedPhone} already contacted/active in CRM (stage: ${existingCrmLead[0].stage}). Marking duplicate.`);
        await supabase.from('businesses').update({ outreach_stage: 'duplicate' }).eq('id', lead.id);
        continue;
      }
      // ── END DUPLICATE DETECTION ────────────────────────────────

      processedPhones.add(cleanedPhone);
      let pitchMessage = "";

      // Fetch deep enrichment data if available
      const { data: enrichment } = await supabase
        .from('website_enrichment')
        .select('*')
        .eq('lead_id', lead.id)
        .maybeSingle();

      const hasWebsite = isValidWebsite(lead.website);

      if (hasWebsite) {
        console.log(`[AGENT-LOOP] 🌐 Lead ${lead.id} HAS website. Running Deep Pitch Strategy...`);
        
        let pitchAngle = "I noticed some missed opportunities to capture more leads online.";
        if (enrichment) {
          if (enrichment.has_chatbot) {
             pitchAngle = "I saw you have a chatbot, but noticed it could be optimized with our AI voice-agent routing.";
          } else if (enrichment.seo_score < 5) {
             pitchAngle = "I ran a quick audit on your site and noticed your SEO could easily be tweaked to rank higher locally.";
          }
        }
        
        const draft = `Hi, I was looking for ${lead.industry || 'services'} in your area and found ${lead.place_name}.
${pitchAngle}
I put together a quick 1-min video showing exactly how to fix this. Mind if I send the link here?`;

        pitchMessage = await rewriteWithAI(draft, { ...lead, ai_human_summary: enrichment?.ai_human_summary }) || draft;

      } else {
        console.log(`[AGENT-LOOP] 🚫 Lead ${lead.id} NO website. Sending Builder Teaser...`);
        
        const draft = `Hey, I noticed *${lead.place_name}* doesn't have a website listed on Google Maps. 
We are building custom interactive demo websites for businesses in your area. Would you be interested in seeing a free mock-up of what it could look like?`;

        pitchMessage = await rewriteWithAI(draft, lead) || draft;
      }

      // Send via wa-service (cleanedPhone already sanitized in dedup block above)
      console.log(`[AGENT-LOOP] 🚀 Dispatching pitch to wa-service for ${cleanedPhone} (raw: ${lead.phone})`);
      try {
        const sendRes = await fetch(WA_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`
          },
          body: JSON.stringify({
            phone: cleanedPhone,
            message: pitchMessage,
            bizName: lead.place_name,
            leadId: lead.id,
            type: 'automation'
          })
        });

        if (sendRes.ok) {
           // Enroll them in wa_enrollments so replies trigger the intent parser
           // Use upsert on phone to prevent duplicate enrollment rows
           await supabase.from('wa_enrollments').upsert({
              lead_id: lead.id,
              phone: cleanedPhone,
              biz_name: lead.place_name || null,
              city: lead.search_city || null,
              status: 'active',
              current_step: 1,
              next_run_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
              last_sent_at: new Date().toISOString()
           }, { onConflict: 'phone' });

           // Mark lead as pitched so we don't process it again
           await supabase.from('businesses').update({ outreach_stage: 'stage_1_pitched' }).eq('id', lead.id);

           // Mark lead as contacted in the CRM/Admin dashboard
           await supabase.from('pipeline_leads').update({ stage: 'contacted' }).or(`business_id.eq.${lead.id},phone.eq.${cleanedPhone}`);
        } else {
           console.error(`[AGENT-LOOP] ❌ wa-service rejected dispatch: ${await sendRes.text()}`);
        }
      } catch (waErr) {
        console.error(`[AGENT-LOOP] ❌ Failed to reach wa-service:`, waErr.message);
      }
    }

  } catch (err) {
    console.error('[AGENT-LOOP] 💥 Critical Loop Failure:', err.message);
  }
}
