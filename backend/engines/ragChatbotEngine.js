import fetch from 'node-fetch';
import supabase from '../supabaseClient.js';

// ==========================================
// RAG KNOWLEDGE BASE
// ==========================================
// In a full production scale, this would be queried from Supabase pgvector using embeddings.
// For Phase 4, we inject this core context into the Gemini System Prompt directly.
const KNOWLEDGE_BASE = `
You are the GrowthAI conversational WhatsApp assistant.
Your goal is to answer questions, build trust, and hold the lead's attention until a human admin takes over.

[CORE FEATURES WE PROVIDE]
- Automated Lead Scraping (Target Market Agent)
- Deep Website Intelligence & SEO Audits
- Automated Cold Email Outreach
- Automated WhatsApp Outreach Sequences
- CRM Pipeline Management
- [UPCOMING] RAG-based AI Chatbots for our clients
- [UPCOMING] AI Voice Agents for our clients

[PRICING]
- Starter Plan: $97/month (Includes 1,000 leads, basic CRM, Email automation)
- Pro Plan: $297/month (Includes 5,000 leads, WhatsApp automation, Advanced SEO Intelligence)
- Enterprise Plan: Custom pricing (Includes custom integrations, unlimited users, white-glove setup)

[COMPANY FAQs]
Q: Do you build the websites?
A: Yes! We can automatically generate beautiful, SEO-optimized demo websites for you using our Vercel integration.
Q: How quickly can a human get back to me?
A: Our team has been notified and will jump into this chat shortly. I'm just here to answer any immediate questions you have!
`;

export async function generateRagResponse(leadId, incomingMessage) {
  try {
    // 1. Fetch previous conversation context from database (if available)
    // We assume the webhook has stored the incoming message in a chat_logs or activities table.
    // For now, we will just use the current incoming message.
    
    // 2. Construct the Prompt with RAG context
    const prompt = `
${KNOWLEDGE_BASE}

The customer just sent this message on WhatsApp:
"${incomingMessage}"

Respond conversationally, concisely, and friendly. Do not use corporate jargon.
Keep your response under 3 sentences. Answer their question based ONLY on the knowledge base provided above.
If they ask something not in the knowledge base, say: "That's a great question! I've pinged our human team to give you the exact details on that shortly."
`;

    // 3. Call Gemini
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const geminiData = await geminiRes.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
        throw new Error(geminiData.error?.message || "RAG engine failed to generate candidate.");
    }
    
    let aiResponse = geminiData.candidates[0].content.parts[0].text || "";
    aiResponse = aiResponse.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();

    // 4. Notify Admin
    await notifyAdmin(leadId, incomingMessage, aiResponse);

    return aiResponse;
  } catch (error) {
    console.error('RAG Engine Error:', error);
    return "I've passed your message to our team! Someone will be with you shortly to assist.";
  }
}

async function notifyAdmin(leadId, customerMessage, aiResponse) {
  try {
    // Log the interaction as an activity so it appears on the dashboard
    await supabase.from('activities').insert({
      lead_id: leadId,
      type: 'rag_chatbot_engaged',
      title: 'AI Chatbot Engaged Lead',
      description: `Customer: "${customerMessage}"\nAI: "${aiResponse}"`
    });
    
    // In a real scenario, this might also trigger a WebSocket push or an SMS/Email to the admin
    console.log(`[RAG ENGINE] Admin notified for lead ${leadId}. Customer said: "${customerMessage}"`);
  } catch (err) {
    console.error('Failed to notify admin:', err);
  }
}
