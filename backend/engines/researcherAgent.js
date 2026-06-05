import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendTelegramNotification } from './telegramBot.js';
import fetch from 'node-fetch';
import { importFromScraper } from './crmEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SCRAPER_DIR = path.resolve(__dirname, '../../scraper');

const TIER2_CITIES = [
  'Agra', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore',
  'Bhopal', 'Patna', 'Varanasi', 'Nagpur', 'Coimbatore',
  'Kochi', 'Vizag', 'Mysore', 'Udaipur', 'Jodhpur',
  'Dehradun', 'Haridwar', 'Rishikesh', 'Amritsar', 'Surat',
];

export async function runResearcherAgent(supabase) {
  // Quiet hours check (9:00 AM to 6:45 PM only)
  const tzOptions = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false };
  const timeString = new Date().toLocaleTimeString('en-US', tzOptions);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  if (hours > 18 || (hours === 18 && minutes > 45) || hours < 9) {
    console.log('[RESEARCHER] 🌙 Outside working hours (after 6:45 PM or before 9:00 AM Kolkata time). Skipping scrape cycle.');
    return;
  }

  console.log('[RESEARCHER] Starting niche research cycle...');

  try {
    const saturated = await getSaturatedCombos(supabase);
    console.log(`[RESEARCHER] Found ${saturated.length} saturated niche+city combos`);

    const { niche, city, reason } = await pickNicheWithGemini(saturated);
    console.log(`[RESEARCHER] Gemini picked: ${niche} in ${city} — ${reason}`);

    sendTelegramNotification(
      `🧠 *Researcher Agent*\n\nPicked *${niche}* in *${city}*\n_${reason}_\n\n🔍 Starting scrape...`
    );

    await runScraper(niche, city);
    console.log('[RESEARCHER] Scraper finished, starting deep scraper...');

    await runDeepScraper();
    console.log('[RESEARCHER] Deep scraper finished');

    // Auto-import newly scraped leads into CRM
    console.log('[RESEARCHER] Importing newly scraped leads into CRM pipeline...');
    const imported = await importFromScraper().catch(e => {
      console.error('[RESEARCHER] ⚠️ Auto-import after scrape failed:', e.message);
      return 0;
    });
    console.log(`[RESEARCHER] CRM Sync complete: ${imported} leads imported.`);

    sendTelegramNotification(
      `✅ *Research cycle complete*\n\n*Niche:* ${niche}\n*City:* ${city}\nScrape + deep scrape done.`
    );
  } catch (err) {
    console.error('[RESEARCHER] Error:', err.message);
    sendTelegramNotification(`❌ *Researcher Agent Error*\n\n${err.message}`);
  }
}

async function getSaturatedCombos(supabase) {
  const { data, error } = await supabase
    .rpc('get_saturated_combos')
    .select('*');

  if (!error && data) {
    return data.map((row) => `${row.industry} in ${row.city}`);
  }

  // Fallback: manual aggregation query
  const { data: businesses, error: bizErr } = await supabase
    .from('businesses')
    .select('industry, city');

  if (bizErr) {
    console.error('[RESEARCHER] Supabase query error:', bizErr.message);
    return [];
  }

  const counts = {};
  for (const biz of businesses || []) {
    const key = `${(biz.industry || 'unknown').toLowerCase()}|${(biz.city || 'unknown').toLowerCase()}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .filter(([, count]) => count >= 20)
    .map(([key]) => {
      const [industry, city] = key.split('|');
      return `${industry} in ${city}`;
    });
}

async function pickNicheWithGemini(saturatedCombos) {
  const saturatedList = saturatedCombos.length > 0
    ? saturatedCombos.join('\n- ')
    : 'None yet';

  const prompt = `You are a lead-generation strategist for a digital agency in India.

Your job is to pick the BEST business niche + tier-2 city combination for scraping leads.
Focus on businesses that NEED websites or digital presence: restaurants, salons, clinics, gyms, hotels, coaching centers, tuition centers, dentists, pet shops, bakeries, car repair shops, etc.

Tier 2 cities to choose from:
${TIER2_CITIES.join(', ')}

AVOID these saturated combos (already have 20+ leads):
- ${saturatedList}

Pick ONE niche and ONE city that would yield the most untapped leads right now.

Respond ONLY with valid JSON:
{"niche": "...", "city": "...", "reason": "..."}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 256,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse Gemini response: ${text}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  if (!parsed.niche || !parsed.city) {
    throw new Error(`Invalid Gemini response structure: ${JSON.stringify(parsed)}`);
  }

  return parsed;
}

function runScraper(niche, city) {
  return new Promise((resolve, reject) => {
    const query = `${niche} in ${city}`;
    console.log(`[RESEARCHER] Running scraper: "${query}" limit=30`);

    const proc = spawn('python3', ['main.py', '--query', query, '--city', city, '--limit', '30'], {
      cwd: SCRAPER_DIR,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`[RESEARCHER] Scraper exited with code 0`);
        resolve(stdout);
      } else {
        console.error(`[RESEARCHER] Scraper stderr: ${stderr}`);
        reject(new Error(`Scraper exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn scraper: ${err.message}`));
    });
  });
}

function runDeepScraper() {
  return new Promise((resolve, reject) => {
    console.log('[RESEARCHER] Running deep_scraper.py...');

    const proc = spawn('python3', ['deep_scraper.py'], {
      cwd: SCRAPER_DIR,
      stdio: 'pipe',
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        console.log('[RESEARCHER] Deep scraper exited with code 0');
        resolve(stdout);
      } else {
        console.error(`[RESEARCHER] Deep scraper stderr: ${stderr}`);
        reject(new Error(`Deep scraper exited with code ${code}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to spawn deep scraper: ${err.message}`));
    });
  });
}
