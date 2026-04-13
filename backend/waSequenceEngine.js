import supabase from './supabaseClient.js';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { rewriteWithAI } from './geminiHelper.js';
import { sendEmail } from './emailEngine.js';

// Helper to wrap URLs for tracking
function wrapUrls(text, trackingId, baseUrl) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `${baseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`;
  });
}

const WA_SERVICE_URL = 'http://localhost:4000/api/wa/send';

/**
 * PHASE 8 REFACTOR:
 * Dynamic Sequence Engine
 * Checks all active campaign enrollments against their sequence schedules.
 * Generates personalized messages and queues them for the Chrome Extension.
 */
export async function processSequences() {
  console.log('[WA-SEQ-DRIP] Scanning for due outreach tasks...');
  
  try {
    const now = new Date().toISOString();

    // 1. Get all active enrollments that are due for processing
    // next_run_at being null means it's Step 0 (initial send)
    const { data: enrollments, error } = await supabase
      .from('campaign_leads')
      .select(`
        *,
        businesses ( id, place_name, phone, city ),
        campaigns ( id, name )
      `)
      .eq('status', 'active')
      .or(`next_run_at.lte.${now},next_run_at.is.null`);

    if (error) throw error;
    if (!enrollments || enrollments.length === 0) {
      console.log('[WA-SEQ-DRIP] No leads due for follow-up.');
      return;
    }

    console.log(`[WA-SEQ-DRIP] Processing ${enrollments.length} due enrollments.`);

    for (const enrollment of enrollments) {
      // 2. Find the current step for this lead in their campaign
      const { data: steps } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('campaign_id', enrollment.campaign_id)
        .order('day_offset', { ascending: true });

      if (!steps || steps.length === 0) continue;

      const currentStepIndex = enrollment.current_step;
      const currentStep = steps[currentStepIndex];

      if (!currentStep) {
        // No more steps left — campaign completed for this lead
        await supabase.from('campaign_leads').update({ status: 'completed' }).eq('id', enrollment.id);
        continue;
      }

      // 3. Generate the message
      const biz = enrollment.businesses;
      let body = currentStep.template_body
        .replace(/{{business_name}}/g, biz.place_name || 'your business')
        .replace(/{{city}}/g, biz.city || 'your city')
        .replace(/{{contact_name}}/g, biz.place_name?.split(' ')[0] || 'Team');

      // PHASE 9: Human-Fluid Automation (AI Rewrite)
      // Only rewrite if we have enough context about the business
      const { data: fullBiz } = await supabase.from('business_intelligence').select('ai_human_summary').eq('business_id', biz.id).single();
      
      const aiRewritten = await rewriteWithAI(body, { 
        place_name: biz.place_name, 
        ai_human_summary: fullBiz?.ai_human_summary 
      });

      if (aiRewritten) {
        console.log(`[WA-SEQ-DRIP] AI Personalization applied for ${biz.place_name}`);
        body = aiRewritten;
      }

      // 4. Handle Dispatches Based on Channel
      if (currentStep.channel === 'email') {
        try {
          // Find if we have an email for this business
          const { data: businessDetail } = await supabase.from('pipeline_leads').select('email').eq('business_name', biz.place_name).single();
          
          if (businessDetail?.email) {
            await sendEmail({
              to: businessDetail.email,
              toName: biz.place_name?.split(' ')[0] || 'Team',
              businessName: biz.place_name,
              subject: `Update regarding ${biz.place_name}`,
              body: body,
              campaignId: enrollment.campaign_id
            });
            console.log(`[DRIP-ENGINE] 📧 Email sent to ${businessDetail.email}`);
          } else {
            console.warn(`[DRIP-ENGINE] ⚠️ Skip Email: No address found for ${biz.place_name}`);
          }
        } catch (mailErr) {
          console.error(`[DRIP-ENGINE] 📧 Email failed for ${biz.place_name}:`, mailErr.message);
        }
      }

      // 5. Always record in pending_outreach for history/trackability
      const { error: queueErr } = await supabase.from('pending_outreach').insert({
        lead_id: biz.id,
        campaign_id: enrollment.campaign_id,
        step_id: currentStep.id,
        channel: currentStep.channel,
        message_body: body,
        status: currentStep.channel === 'email' ? 'sent' : 'pending',
        scheduled_for: now
      });

      if (queueErr) {
        console.error(`[DRIP-ENGINE] Failed to log/queue lead ${biz.id}:`, queueErr.message);
        continue;
      }

      // 5. Calculate next run date
      const nextStepIndex = currentStepIndex + 1;
      const nextStep = steps[nextStepIndex];
      let nextRunAt = null;

      if (nextStep) {
        // Offset is relative to "now" (when the previous step was sent)
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (nextStep.day_offset || 1));
        nextRunAt = nextDate.toISOString();
      }

      // 6. Update enrollment state
      await supabase.from('campaign_leads').update({
        current_step: nextStepIndex,
        next_run_at: nextRunAt,
        status: nextStep ? 'active' : 'completed'
      }).eq('id', enrollment.id);

      console.log(`[WA-SEQ-DRIP] ✅ Queued Step ${currentStepIndex + 1} for ${biz.place_name}. Next run: ${nextRunAt || 'Completed'}`);
    }

  } catch (err) {
    console.error('[WA-SEQ-DRIP] Critical failure:', err.message);
  }
}
