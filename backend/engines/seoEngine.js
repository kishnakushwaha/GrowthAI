import fetch from 'node-fetch';

/**
 * Uses Gemini to generate highly optimized SEO meta tags and Schema.org markup
 * based on a business's raw profile data.
 */
export async function generateSeoTags(businessName, industry, city, description) {
  try {
    const prompt = `
You are an expert SEO specialist. Generate raw HTML for the <head> of a website for the following local business:
Business Name: ${businessName}
Industry: ${industry || 'Local Service'}
Location: ${city || 'Local Area'}
Description: ${description || 'Providing top-tier services to our community.'}

You must generate:
1. An optimized <title> (50-60 chars)
2. An optimized <meta name="description"> (150-160 chars)
3. 3-5 highly relevant <meta name="keywords">
4. Standard OpenGraph tags (og:title, og:description, og:type="website")
5. A JSON-LD Schema.org <script type="application/ld+json"> block for a LocalBusiness.

Output ONLY the raw HTML code. Do not use markdown blocks like \`\`\`html. Just output the HTML.
`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const geminiData = await geminiRes.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
        throw new Error("SEO generation failed.");
    }
    
    let seoHtml = geminiData.candidates[0].content.parts[0].text || "";
    seoHtml = seoHtml.replace(/```[a-z]*\n/gi, '').replace(/```/g, '').trim();

    return seoHtml;
  } catch (error) {
    console.error('SEO Engine Error:', error);
    // Fallback basic SEO
    return `
    <title>${businessName} - Top ${industry} in ${city}</title>
    <meta name="description" content="Contact ${businessName} for the best ${industry} services in ${city}.">
    `;
  }
}
