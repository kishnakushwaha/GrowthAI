import fetch from 'node-fetch';
import supabase from '../supabaseClient.js';

/**
 * PHASE 9: Gemini AI Utility
 * Centralized logic for AI rewriting and personalization.
 * 
 * X4: Rate limit handling — detects 429s and logs failures
 * F6: Industry-specific prompt overrides (reads from prompts table)
 */

// X4: Simple rate limiter — 4 second delay between Gemini calls
let lastCallTime = 0;
const MIN_DELAY_MS = 4000;

async function waitForRateLimit() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < MIN_DELAY_MS) {
    const waitTime = MIN_DELAY_MS - elapsed;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastCallTime = Date.now();
}

// F6: Load industry-specific prompt override (if exists)
// Self-learning: if industry not found, auto-generates one via Gemini and caches it
async function getIndustryPrompt(industry) {
  if (!industry) return null;
  const normalized = industry.toLowerCase().trim();
  try {
    const { data } = await supabase
      .from('prompts')
      .select('system_prompt')
      .eq('industry', normalized)
      .maybeSingle();
    
    if (data?.system_prompt) return data.system_prompt;

    // Not found — auto-generate a new industry prompt via Gemini and cache it
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    console.log(`[GEMINI] 🧠 Auto-generating prompt for new industry: "${normalized}"`);
    const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `You are a marketing AI system. Generate a concise system prompt (2-3 sentences max) for an AI sales agent sending WhatsApp messages to "${normalized}" businesses in India. The prompt should specify the tone, key selling points to mention, and what to avoid. Output ONLY the system prompt text, nothing else.` }] }] })
    });

    if (genResponse.ok) {
      const genData = await genResponse.json();
      const generatedPrompt = genData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (generatedPrompt) {
        // Cache it in the database for future use
        await supabase.from('prompts').insert({ industry: normalized, system_prompt: generatedPrompt }).then(() => {
          console.log(`[GEMINI] ✅ Cached new prompt for industry: "${normalized}"`);
        });
        return generatedPrompt;
      }
    }
    return null;
  } catch {
    return null; // Table may not exist yet — graceful fallback
  }
}

export async function rewriteWithAI(baseTemplate, businessData, contactName = 'the owner') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY missing. Skipping AI rewrite.');
    return null;
  }

  try {
    // X4: Respect rate limits
    await waitForRateLimit();

    let contextString = '';
    if (businessData.ai_human_summary) {
        contextString = `Strategic context about their business: ${businessData.ai_human_summary}`;
    }

    // F6: Check for industry-specific prompt override
    const industryPrompt = await getIndustryPrompt(businessData.industry);
    
    const defaultPrompt = `You are a casual, highly-effective sales closer sending a 1-to-1 WhatsApp message. 
Take the following Template Draft and rewrite it so it sounds like a real human quickly typed it out on their phone to ${contactName} at ${businessData.place_name || 'their business'}. 
Do not use corporate jargon. Avoid "Dear Sir/Madam". Be brief, punchy, and conversational (lowercase is fine, limited punctuation ok).`;

    const systemPrompt = industryPrompt || defaultPrompt;

    const prompt = `${systemPrompt}

${contextString}

Template Draft:
${baseTemplate}

Output ONLY the raw rewritten WhatsApp message. No conversational filler or explanations.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    // X4: Detect rate limiting
    if (response.status === 429) {
      console.warn(`⚠️ Gemini rate limited (429). Will retry next cycle.`);
      await logRewriteFailure(businessData, 'RATE_LIMITED');
      return null;
    }

    if (!response.ok) {
      console.warn(`⚠️ Gemini HTTP ${response.status}: ${response.statusText}`);
      await logRewriteFailure(businessData, `HTTP_${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      console.warn('⚠️ Gemini returned no candidates for rewrite.');
      await logRewriteFailure(businessData, 'NO_CANDIDATES');
      return null;
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    console.error('❌ Gemini Rewrite Error:', err.message);
    await logRewriteFailure(businessData, err.message);
    return null;
  }
}

// X4: Log rewrite failures for monitoring
async function logRewriteFailure(businessData, reason) {
  try {
    await supabase.from('rewrite_failures').insert({
      business_name: businessData.place_name || 'unknown',
      reason,
      created_at: new Date().toISOString()
    });
  } catch {
    // Table may not exist yet — silent fail
  }
}
