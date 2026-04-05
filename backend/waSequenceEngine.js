import supabase from './supabaseClient.js';
import fetch from 'node-fetch';

const WA_SERVICE_URL = 'http://localhost:4000/api/wa/send';

// The 3-Step Sequence Templates (High-Reply Versions)
const SEQUENCE_STEPS = [
  {
    step: 1,
    delayDays: 0,
    body: `Hi [[contact_name]],

I came across [[business_name]] while reviewing businesses in [[city]].

I noticed a few missed opportunities where you could get more enquiries from Google search & Meta Ads.

I prepared a short visibility report for your business.

Can I share it here?`
  },
  {
    step: 2,
    delayDays: 2, // Day 3 (1+2)
    body: `Hi [[contact_name]],

Just checking again — while reviewing [[business_name]], I noticed competitors in [[city]] are already capturing leads from Google searches that your business could also receive.

I included those keywords inside the report I prepared.

Should I send it here?`
  },
  {
    step: 3,
    delayDays: 4, // Day 7 (3+4)
    body: `Hi [[contact_name]],

Last message from my side 🙂

We recently helped similar businesses improve enquiry flow through Google visibility improvements and targeted ads.

I had prepared a quick suggestion report for [[business_name]] as well.

Let me know if you'd like me to share it.`
  }
];

export async function processSequences() {
  console.log('[WA-SEQ] Running automation check...');
  
  try {
    // 1. Get all active enrollments that are due for next step
    const { data: enrollments, error } = await supabase
      .from('wa_enrollments')
      .select('*')
      .eq('status', 'active')
      .lte('next_run_at', new Date().toISOString());

    if (error) throw error;
    if (!enrollments || enrollments.length === 0) {
      console.log('[WA-SEQ] No pending messages found.');
      return;
    }

    console.log(`[WA-SEQ] Found ${enrollments.length} messages to process.`);

    for (const enrollment of enrollments) {
      const stepConfig = SEQUENCE_STEPS.find(s => s.step === enrollment.current_step);
      if (!stepConfig) {
        // Mark as completed if no more steps
        await supabase.from('wa_enrollments').update({ status: 'completed' }).eq('id', enrollment.id);
        continue;
      }

      // Render placeholders [[ ]]
      let renderedBody = stepConfig.body
        .replace(/\[\[contact_name\]\]/g, enrollment.biz_name?.split(' ')[0] || 'Team')
        .replace(/\[\[business_name\]\]/g, enrollment.biz_name || 'your business')
        .replace(/\[\[city\]\]/g, enrollment.city || 'your city');

      // Send via WhatsApp Service
      try {
        const response = await fetch(WA_SERVICE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: enrollment.phone,
            message: renderedBody
          })
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`[WA-SEQ] ✅ Step ${enrollment.current_step} sent to ${enrollment.phone}`);
          
          // Calculate next step
          const nextStep = enrollment.current_step + 1;
          const nextStepConfig = SEQUENCE_STEPS.find(s => s.step === nextStep);
          
          if (nextStepConfig) {
            const nextRunDate = new Date();
            nextRunDate.setDate(nextRunDate.getDate() + nextStepConfig.delayDays);
            
            await supabase.from('wa_enrollments').update({
              current_step: nextStep,
              next_run_at: nextRunDate.toISOString(),
              last_sent_at: new Date().toISOString()
            }).eq('id', enrollment.id);
          } else {
            // End of sequence
            await supabase.from('wa_enrollments').update({
              status: 'completed',
              last_sent_at: new Date().toISOString()
            }).eq('id', enrollment.id);
          }
        } else {
          console.error(`[WA-SEQ] ❌ Failed to send to ${enrollment.phone}:`, result.error);
        }
      } catch (err) {
        console.error(`[WA-SEQ] API Error for ${enrollment.phone}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[WA-SEQ] Fatal processing error:', err.message);
  }
}
