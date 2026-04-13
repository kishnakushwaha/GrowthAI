import fetch from 'node-fetch';

/**
 * PHASE 9: Gemini AI Utility
 * Centralized logic for AI rewriting and personalization.
 */
export async function rewriteWithAI(baseTemplate, businessData, contactName = 'the owner') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY missing. Skipping AI rewrite.');
    return null;
  }

  try {
    let contextString = '';
    if (businessData.ai_human_summary) {
        contextString = `Strategic context about their business: ${businessData.ai_human_summary}`;
    }

    const prompt = `You are a casual, highly-effective sales closer sending a 1-to-1 WhatsApp message. 
Take the following Template Draft and rewrite it so it sounds like a real human quickly typed it out on their phone to ${contactName} at ${businessData.place_name || 'their business'}. 
Do not use corporate jargon. Avoid "Dear Sir/Madam". Be brief, punchy, and conversational (lowercase is fine, limited punctuation ok).

${contextString}

Template Draft:
${baseTemplate}

Output ONLY the raw rewritten WhatsApp message. No conversational filler or explanations.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      console.warn('⚠️ Gemini returned no candidates for rewrite.');
      return null;
    }

    return data.candidates[0].content.parts[0].text.trim();
  } catch (err) {
    console.error('❌ Gemini Rewrite Error:', err.message);
    return null;
  }
}
