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

// ===================== GENERAL LLM CALL HELPER WITH RETRY =====================
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429 || response.status === 503 || response.status === 500) {
      const waitTime = Math.pow(2, attempt) * 4000;
      console.warn(`⚠️ [GeminiHelper] API Error / Rate Limited (${response.status}). Attempt ${attempt}/${maxRetries}. Retrying in ${waitTime / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    return response;
  }
  return fetch(url, options);
}

async function callLLM(prompt, responseMimeType = null) {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  
  if (provider === 'groq' || process.env.GROQ_API_KEY) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is missing in env');
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    
    const response = await fetchWithRetry('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 8192,
        ...(responseMimeType === 'json' ? { response_format: { type: 'json_object' } } : {})
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error('[Groq API Error]:', response.status, err);
      throw new Error(`Groq API returned ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  } 
  
  if (provider === 'grok' || provider === 'xai' || process.env.GROK_API_KEY || process.env.XAI_API_KEY) {
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('GROK_API_KEY/XAI_API_KEY is missing in env');
    const model = process.env.GROK_MODEL || 'grok-2-1212';
    
    const response = await fetchWithRetry('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 8192,
        ...(responseMimeType === 'json' ? { response_format: { type: 'json_object' } } : {})
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error('[Grok API Error]:', response.status, err);
      throw new Error(`Grok API returned ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  // Default: Gemini
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing in env');
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  
  const response = await fetchWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 8192,
        ...(responseMimeType === 'json' ? { response_mime_type: 'application/json' } : {})
      }
    })
  });
  
  if (!response.ok) {
    const err = await response.text();
    console.error('[Gemini API Error]:', response.status, err);
    throw new Error(`Gemini API returned status ${response.status}`);
  }
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
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

    // Not found — auto-generate a new industry prompt via LLM and cache it
    console.log(`[AI] 🧠 Auto-generating prompt for new industry: "${normalized}"`);
    const systemPromptText = `You are a marketing AI system. Generate a concise system prompt (2-3 sentences max) for an AI sales agent sending WhatsApp messages to "${normalized}" businesses in India. The prompt should specify the tone, key selling points to mention, and what to avoid. Output ONLY the system prompt text, nothing else.`;
    
    const generatedPrompt = await callLLM(systemPromptText);
    if (generatedPrompt && generatedPrompt.trim()) {
      const trimmedPrompt = generatedPrompt.trim();
      // Cache it in the database for future use
      await supabase.from('prompts').insert({ industry: normalized, system_prompt: trimmedPrompt }).then(() => {
        console.log(`[AI] ✅ Cached new prompt for industry: "${normalized}"`);
      });
      return trimmedPrompt;
    }
    return null;
  } catch {
    return null; // Table may not exist yet — graceful fallback
  }
}

export async function rewriteWithAI(baseTemplate, businessData, contactName = 'the owner') {
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
Do not use corporate jargon. Avoid "Dear Sir/Madam". Be brief, punchy, and conversational (lowercase is fine, limited punctuation ok).
- Use *bold* (asterisks) for the business name and key terms — this is WhatsApp bold syntax
- Use _italic_ (underscores) for subtle emphasis on feelings or benefits
- Keep the message casual, warm, and human — like a real person texting
- Never use markdown headers (#), links, HTML tags, or emojis overload
- Never offer or mention a "video" or "1-min video". Instead, always offer a "free interactive mockup website", "custom preview website", or "demo website"
- Keep messages under 4 sentences
- The output should look natural on WhatsApp, not like a marketing email`;

    const systemPrompt = industryPrompt || defaultPrompt;

    const prompt = `${systemPrompt}

${contextString}

Template Draft:
${baseTemplate}

Output ONLY the raw rewritten WhatsApp message. No conversational filler or explanations.`;

    const textResult = await callLLM(prompt);
    if (!textResult || !textResult.trim()) {
      console.warn('⚠️ AI returned no candidates for rewrite.');
      await logRewriteFailure(businessData, 'EMPTY_RESPONSE');
      return null;
    }

    return textResult.trim();
  } catch (err) {
    console.error('❌ AI Rewrite Error:', err.message);
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

export async function parseReplyIntent(messageBody) {
  try {
    await waitForRateLimit();
    const prompt = `You are an expert sales assistant analyzing a reply from a business owner on WhatsApp.
Determine if they are showing positive interest in our offer (AI Chatbots, Voice Agents, or SEO).
If they say "yes", "sure", "tell me more", "price?", "how does it work", or anything positive/inquisitive, they are "Interested".
If they say "stop", "no", "not interested", "unsubscribe", or are angry/dismissive, they are NOT interested.
If it's an auto-reply or vague like "ok", lean towards NOT interested unless it's clearly a prompt to continue.

Message from customer: "${messageBody}"

Respond with ONLY a JSON object in this format:
{"interested": true/false, "reason": "brief reason"}`;

    const textResult = await callLLM(prompt, 'json');
    if (!textResult) return { interested: false, reason: "No text returned" };
    
    try {
      const cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse intent JSON:', e);
      return { interested: false, reason: "JSON parse error" };
    }
  } catch (err) {
    console.error('❌ AI Intent Parse Error:', err.message);
    return { interested: false, reason: "Exception thrown" };
  }
}

