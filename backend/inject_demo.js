import supabase from './supabaseClient.js';

async function injectDemo() {
  console.log("Injecting AI Preview Demo Data...");

  // 1. Get first lead
  const { data: leads } = await supabase.from('pipeline_leads').select('id, business_name').limit(1);
  if (!leads || leads.length === 0) {
    console.log("No leads found in pipeline. Cannot inject demo.");
    return;
  }
  
  const lead = leads[0];
  console.log(`Target Lead: ${lead.business_name} (ID: ${lead.id})`);

  // 2. Give the lead an awesome score
  await supabase.from('pipeline_leads').update({ lead_score: 95, priority: 'high' }).eq('id', lead.id);

  // 3. Insert a mock AI-Generated Outreach Log
  const originalMessage = "Hi TEAM,\n\nI saw your website and wanted to offer our SEO services to get you more clients.\n\nThanks,\nGrowthAI";
  
  const aiMessage = `Hey the team at ${lead.business_name},\n\nI noticed your gym has been getting some tough reviews lately regarding equipment maintenance. I know competition is fierce right now.\n\nWe specialize in helping fitness centers like yours bounce back and dominate local Google searches, bringing in 20-30 new high-paying signups per month. Would you be open to a quick 10-minute chat this week to see how we could help turn things around?\n\nBest,\nGrowthAI Team`;

  const { error } = await supabase.from('pending_outreach').insert({
    lead_id: lead.id,
    campaign_id: 1, // Mock
    step_id: 1,     // Mock
    channel: 'whatsapp',
    message_body: aiMessage,
    original_body: originalMessage,
    status: 'sent'
  });

  if (error) {
    console.error("Failed to inject demo outreach:", error.message);
  } else {
    console.log("✅ Demo injected successfully! Check your CRM dashboard.");
  }
}

injectDemo();
