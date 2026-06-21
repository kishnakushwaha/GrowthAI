import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const BUILD_DIR = path.join(__dirname, '..', '.demo-builds');

function parseVercelUrl(stdout) {
  const lines = stdout.split('\n');
  const urlLines = lines
    .map(line => line.trim())
    .filter(line => line.includes('https://') && !line.includes('vercel.com'));
  
  if (urlLines.length === 0) return null;
  
  // Prioritize the public production alias domain url
  const aliasedLine = urlLines.find(line => line.includes('Aliased'));
  const targetLine = aliasedLine || urlLines[0];
  
  const words = targetLine.split(/\s+/);
  const url = words.find(w => w.startsWith('https://'));
  return url ? url.trim() : null;
}

// ===================== CURATED FALLBACK IMAGES =====================
const CURATED_IMAGES = {
  'medical': [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=2000&auto=format&fit=crop'
  ],
  'home_services': [
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2000&auto=format&fit=crop'
  ],
  'food': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop'
  ],
  'beauty': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=2000&auto=format&fit=crop'
  ],
  'fitness': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=2000&auto=format&fit=crop'
  ],
  'education': [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2000&auto=format&fit=crop'
  ],
  'professional': [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1521791136368-1a983b9293d1?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b8130581f186?q=80&w=2000&auto=format&fit=crop'
  ],
  'spa': [
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=2000&auto=format&fit=crop'
  ],
  'massage': [
    'https://images.unsplash.com/photo-1600334129128-68505d48fc36?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596178060671-7a80dc8059ea?q=80&w=2000&auto=format&fit=crop'
  ],
  'dentist': [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop'
  ],
  'dental': [
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop'
  ],
  'gym': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=2000&auto=format&fit=crop'
  ],
  'fitness': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?q=80&w=2000&auto=format&fit=crop'
  ],
  'restaurant': [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop'
  ],
  'salon': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605497746444-ac9dbd324d58?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=2000&auto=format&fit=crop'
  ],
  'saloon': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605497746444-ac9dbd324d58?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?q=80&w=2000&auto=format&fit=crop'
  ],
  'plumb': [
    'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?q=80&w=2000&auto=format&fit=crop'
  ],
  'default': [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556761175-b8130581f186?q=80&w=2000&auto=format&fit=crop'
  ]
};

function getPremiumImages(query, macroIndustry = 'generic', count = 5) {
  const lowercaseQuery = (query || '').toLowerCase();
  let selectedImages = null;
  
  if (macroIndustry && CURATED_IMAGES[macroIndustry]) {
    selectedImages = CURATED_IMAGES[macroIndustry];
  }
  
  if (!selectedImages) {
    for (const [key, urls] of Object.entries(CURATED_IMAGES)) {
      if (lowercaseQuery.includes(key)) {
        selectedImages = urls;
        break;
      }
    }
  }
  
  if (!selectedImages) {
    selectedImages = CURATED_IMAGES.default;
  }
  
  return Array(count).fill(0).map((_, i) => {
    const baseUrl = selectedImages[i % selectedImages.length];
    return `${baseUrl}&sig=${i}`;
  });
}

// ===================== GENERAL LLM CALL HELPER WITH RETRY =====================
async function fetchWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429 || response.status === 503 || response.status === 500) {
      const waitTime = Math.pow(2, attempt) * 4000;
      console.warn(`⚠️ [BuilderAgent] API Error / Rate Limited (${response.status}). Attempt ${attempt}/${maxRetries}. Retrying in ${waitTime / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    return response;
  }
  return fetch(url, options);
}

async function callLLM(prompt, responseMimeType = null) {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  
  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is missing in env');
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    console.log(`[LLM] Calling Groq API with model ${model}...`);
    
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
  
  if (provider === 'grok' || provider === 'xai') {
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (!apiKey) throw new Error('GROK_API_KEY/XAI_API_KEY is missing in env');
    const model = process.env.GROK_MODEL || 'grok-2-1212';
    console.log(`[LLM] Calling xAI Grok API with model ${model}...`);
    
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
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  console.log(`[LLM] Calling Gemini API with model ${model}...`);
  
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

// ===================== HELPER: Get business name from lead =====================
function getBizName(lead) {
  return lead.place_name || lead.business_name || lead.businessName || 'Business';
}

// ===================== HELPER: Extract & Clean Real Google Photos =====================
function extractGooglePhotos(lead) {
  const photoUrls = [];
  
  // Collect potential image lists
  const rawPhotos = lead.photos || lead.photo_urls || lead.image_urls || lead.images || lead.google_photos || lead.google_photo_urls || [];
  const candidates = Array.isArray(rawPhotos) ? rawPhotos : [rawPhotos].filter(Boolean);
  
  // Collect singular properties
  if (lead.photo && typeof lead.photo === 'string') candidates.push(lead.photo);
  if (lead.image && typeof lead.image === 'string') candidates.push(lead.image);
  
  for (const item of candidates) {
    let url = '';
    if (typeof item === 'string') {
      url = item;
    } else if (item && typeof item === 'object' && item.url) {
      url = item.url;
    }
    
    if (!url || typeof url !== 'string' || !url.startsWith('http')) continue;
    
    // Heuristic: filter out logos/icons/avatars/markers
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('logo') || lowerUrl.includes('avatar') || lowerUrl.includes('icon') || lowerUrl.includes('marker')) {
      console.log(`[ImageFetcher] ⚠️ Skipping unsuitable photo (matched keyword filter): ${url}`);
      continue;
    }
    
    // Resize Google Photos to 1200x800 high-res format
    let formattedUrl = url;
    if (url.includes('googleusercontent.com') || url.includes('ggpht.com') || url.includes('google.com')) {
      const cleanUrl = url.split('=')[0];
      formattedUrl = `${cleanUrl}=w1200-h800-p-k-no`;
    }
    
    photoUrls.push(formattedUrl);
  }
  
  return photoUrls;
}

// ===================== HELPER: Validate Image Availability =====================
async function isImageUrlValid(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (e) {
    return false;
  }
}

// ===================== HELPER: Multi-source Image Selection =====================
async function getFinalImagesList(lead, query, macroIndustry, count = 10) {
  // 1. Get real photos from lead and verify they are accessible (not broken/404)
  const rawGooglePhotos = extractGooglePhotos(lead);
  console.log(`[ImageFetcher] Found ${rawGooglePhotos.length} candidate Google Photos from lead data. Verifying availability...`);
  
  const validationResults = await Promise.all(
    rawGooglePhotos.map(async (url) => {
      const isValid = await isImageUrlValid(url);
      return { url, isValid };
    })
  );
  
  const googlePhotos = validationResults
    .filter(res => res.isValid)
    .map(res => res.url);
    
  console.log(`[ImageFetcher] Verified ${googlePhotos.length} valid Google Photos.`);
  
  // 2. Fetch Unsplash/Curated fallbacks
  let fallbackImages = [];
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      console.log(`[ImageFetcher] 📸 Unsplash API Key found. Searching Unsplash for: "${query}"...`);
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&client_id=${unsplashKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          fallbackImages = data.results.map(img => img.urls.regular);
        }
      }
    } catch (e) {
      console.error('[ImageFetcher] Unsplash search failed:', e.message);
    }
  }
  
  // Pad with curated fallbacks
  if (fallbackImages.length < count) {
    const curated = getPremiumImages(query, macroIndustry, count);
    fallbackImages = [...fallbackImages, ...curated];
  }
  
  // Combine lists: real photos first, then fallbacks
  const combined = Array.from(new Set([...googlePhotos, ...fallbackImages]));
  return combined.slice(0, count);
}

// ===================== AGENT 0: THE INDUSTRY CLASSIFIER =====================
async function classifyIndustry(lead) {
  console.log(`[ClassifierAgent] 🔍 Classifying industry and extracting metadata for ${getBizName(lead)}...`);
  
  const bizName = getBizName(lead);
  const rawIndustry = lead.industry || lead.category || '';
  const reviewsText = lead.reviews ? lead.reviews.map(r => `${r.author || r.author_name || ''}: ${r.text || ''}`).join('\n') : '';
  const gmapDetails = `Business Name: ${bizName}\nCategory/Industry: ${rawIndustry}\nAddress: ${lead.address || ''}\nReviews:\n${reviewsText}`;
  
  const prompt = `
  You are an expert Business Analyst and Web UX Strategist.
  Analyze this local business data from Google Maps and categorize it for building a premium website.
  
  BUSINESS DETAILS:
  ${gmapDetails}
  
  1. Determine the macroIndustry. Select from:
     - "medical" (clinics, dentists, doctors, hospitals, vets, therapists)
     - "home_services" (plumbers, electricians, cleaners, pest control, construction, AC repair)
     - "food" (restaurants, cafes, bakeries, bars, catering)
     - "beauty" (salons, spas, nail salons, makeup studios)
     - "fitness" (gyms, yoga studios, personal trainers, dance classes)
     - "education" (schools, coaching centers, music schools, tutors)
     - "professional" (lawyers, accountants, consultants, agencies)
     - "generic" (retail shops, manufacturing, generic businesses)
     
  2. Identify the subCategory (e.g., "dental_clinic", "unisex_salon", "italian_restaurant", "emergency_plumber").
  
  3. Extract "keyPeople".
     - Look for the name of the main professional, doctor, founder, owner, or head chef in the reviews or business details.
     - For example, if a dentist clinic is "Dr. John Doe Dentistry", or reviews mention "Dr. Shivangi Attri did my root canal", extract "Dr. Shivangi Attri" or "Dr. John Doe".
     - If no specific professional's name is mentioned, return a blank string "". Do NOT invent a name. It must be a real name from the business details or reviews.
     
  4. Extract "specializations" (up to 3 key services or specialties mentioned in the business name or reviews).
  
  5. Identify "targetAudience" (e.g. "families, local residents", "health-conscious individuals", "homeowners").
  
  6. Select "designVibe". Choose from:
     - "trust_medical" (clean, trust-inducing, teal/blue, white)
     - "emergency_home_service" (bold, high-contrast, yellow/red/orange, clean)
     - "cozy_restaurant" (warm, inviting, amber/orange/wood)
     - "elegant_salon" (sophisticated, chic, rose/gold/pastel, modern)
     - "active_gym" (energetic, dark mode, neon green/orange/red, bold typography)
     - "professional_office" (corporate, clean, dark blue/gray, minimal)
     - "modern_minimalist" (default, clean, modern)
     
  You MUST return ONLY valid JSON matching this exact structure:
  {
    "macroIndustry": "medical",
    "subCategory": "dental_clinic", 
    "pageStructure": ["home", "services", "about", "reviews", "contact", "gallery"],
    "features": ["whatsapp_button", "appointment_form", "google_map_embed"],
    "designVibe": "trust_medical",
    "keyPeople": "Dr. Shivangi Attri",
    "specializations": ["Root Canal", "Cosmetic Dentistry", "Teeth Whitening"],
    "targetAudience": "families and Greater Noida residents"
  }
  `;

  const textResult = await callLLM(prompt, 'json');
  try {
    const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);
    
    // Ensure fallback properties exist
    result.macroIndustry = result.macroIndustry || 'generic';
    result.subCategory = result.subCategory || 'local_business';
    result.pageStructure = result.pageStructure || ["home", "services", "about", "contact"];
    result.features = result.features || [];
    result.designVibe = result.designVibe || 'modern_minimalist';
    result.keyPeople = result.keyPeople || '';
    result.specializations = result.specializations || [];
    result.targetAudience = result.targetAudience || 'general public';
    
    return result;
  } catch (err) {
    console.error('[ClassifierAgent] JSON Parse Error:', err, textResult);
    // Safe fallback strategy
    return {
      macroIndustry: 'generic',
      subCategory: 'local_business',
      pageStructure: ["home", "services", "about", "contact"],
      features: [],
      designVibe: 'modern_minimalist',
      keyPeople: '',
      specializations: [],
      targetAudience: 'general public'
    };
  }
}

// ===================== AGENT 1: THE BRAND DIRECTOR =====================
async function generateBrandStrategy(lead, industryInfo) {
  console.log(`[DirectorAgent] 🕴️ Formulating visual identity for ${getBizName(lead)} based on industry strategy...`);
  
  const bizName = getBizName(lead);
  const infoText = JSON.stringify(industryInfo, null, 2);
  
  const prompt = `
  You are an elite Brand Director for a high-end web design agency.
  Analyze this business and its industry classification to formulate a strict JSON branding strategy.
  
  Business: ${bizName}
  Industry Info:
  ${infoText}

  Theme Color & Mode Guidelines:
  - medical (clinics, dentists, doctors): themeMode "light", teal/emerald/blue (e.g. primary "#0d9488" (teal-600), primaryLight "#f0fdfa" (teal-50), primaryDark "#0f766e" (teal-700), accent "#f59e0b" (amber-500), bg "#ffffff", bgSecondary "#f8fafc", text "#0f172a", textSecondary "#475569")
  - home_services (plumbing, electrical): themeMode "light", blue/amber/orange (primary "#2563eb", primaryLight "#f0f9ff", primaryDark "#1d4ed8", accent "#f59e0b", bg "#ffffff", bgSecondary "#f8fafc", text "#0f172a", textSecondary "#475569")
  - food (restaurants, cafes): themeMode "light", cozy warm colors like orange/amber/brown (primary "#ea580c", primaryLight "#fffedd5", primaryDark "#c2410c", accent "#b45309", bg "#fffdfa", bgSecondary "#fdf8f2", text "#1e1b18", textSecondary "#5c5752")
  - beauty (salons, spas): themeMode "light", elegant colors like rose/fuchsia/violet (primary "#db2777", primaryLight "#fff1f2", primaryDark "#be185d", accent "#8b5cf6", bg "#ffffff", bgSecondary "#fff5f5", text "#1f2937", textSecondary "#4b5563")
  - fitness (gyms): themeMode "dark", active energetic colors like lime/green/red/orange (primary "#84cc16" (lime-500), primaryLight "#1f2937", primaryDark "#4d7c0f", accent "#f97316", bg "#09090b", bgSecondary "#18181b", text "#fafafa", textSecondary "#a1a1aa")
  - professional (lawyers, offices): themeMode "light", corporate blue/indigo/slate (primary "#1e3a8a", primaryLight "#eff6ff", primaryDark "#172554", accent "#475569", bg "#ffffff", bgSecondary "#f8fafc", text "#0f172a", textSecondary "#334155")
  - default/generic: themeMode "light", custom colors matching industry
  
  Return ONLY valid JSON matching this exact structure:
  {
    "themeMode": "light",
    "colors": {
      "primary": "#0d9488",
      "primaryLight": "#f0fdfa",
      "primaryDark": "#0f766e",
      "accent": "#f59e0b",
      "bg": "#ffffff",
      "bgSecondary": "#f8fafc",
      "text": "#0f172a",
      "textSecondary": "#475569"
    },
    "fontLink": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@400;700&display=swap",
    "fontFamilyHeading": "font-['Outfit']",
    "fontFamilyBody": "font-['Plus_Jakarta_Sans']",
    "imageKeywords": ["modern dental clinic", "dentist operatory", "teeth whitening"]
  }
  `;

  const textResult = await callLLM(prompt, 'json');
  try {
    const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    const strategy = JSON.parse(cleanedText);
    
    // Add default colors and themeMode if missing
    strategy.themeMode = strategy.themeMode || 'light';
    strategy.colors = strategy.colors || {
      primary: '#0d9488',
      primaryLight: '#f0fdfa',
      primaryDark: '#0f766e',
      accent: '#f59e0b',
      bg: '#ffffff',
      bgSecondary: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#475569'
    };
    
    // Maintain backwards compatibility
    strategy.tailwindPrimaryColor = strategy.colors.primary;
    strategy.componentSelection = {
      hero: 'InlineHero',
      services: 'InlineServices',
      reviews: 'InlineReviews',
      contact: 'InlineContact'
    };
    
    return strategy;
  } catch (err) {
    console.error('[DirectorAgent] JSON Parse Error:', err, textResult);
    // Safe fallback branding strategy
    return {
      themeMode: 'light',
      colors: {
        primary: '#0d9488',
        primaryLight: '#f0fdfa',
        primaryDark: '#0f766e',
        accent: '#f59e0b',
        bg: '#ffffff',
        bgSecondary: '#f8fafc',
        text: '#0f172a',
        textSecondary: '#475569'
      },
      tailwindPrimaryColor: '#0d9488',
      fontLink: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@400;700&display=swap",
      fontFamilyHeading: "font-['Outfit']",
      fontFamilyBody: "font-['Plus_Jakarta_Sans']",
      imageKeywords: ['modern business'],
      componentSelection: {
        hero: 'InlineHero',
        services: 'InlineServices',
        reviews: 'InlineReviews',
        contact: 'InlineContact'
      }
    };
  }
}

// ===================== AGENT 2: THE COPYWRITER =====================
// ===================== AGENT 2: THE COPYWRITER =====================
async function generateSalesCopy(lead, industryInfo) {
  console.log(`[CopywriterAgent] ✍️ Writing industry-specific persuasive sales copy...`);

  // Build reviews context from whatever source we have
  let reviewsText = 'Generate 3 realistic, highly-positive reviews.';
  if (lead.reviews && lead.reviews.length > 0) {
    reviewsText = `Use these REAL Google Maps reviews:\n${JSON.stringify(lead.reviews, null, 2)}`;
  }
  
  const bizName = getBizName(lead);
  const infoText = JSON.stringify(industryInfo, null, 2);

  const prompt = `
  You are a world-class Direct Response Copywriter.
  Write high-converting, emotional, and persuasive copy for a premium website.
  
  Business: ${bizName}
  Industry Information:
  ${infoText}
  
  Address: ${lead.address || lead.city || 'N/A'}
  Phone: ${lead.phone || 'N/A'}
  
  ${reviewsText}
  
  INSTRUCTIONS FOR KEY PEOPLE & HIGHLIGHTS:
  - If a key person name (like a doctor, e.g. "Dr. Shivangi Attri") is present in the industry information, you MUST highlight them in the about page story and mission (e.g. "Founded by Dr. Shivangi Attri", "Dr. Attri and her team").
  - Do NOT hardcode names that are not in the industry details. Dynamic owner/founder names must be extracted from the details.
  
  INSTRUCTIONS FOR SERVICES:
  - Generate exactly 5 or 6 services suitable for the business subCategory.
  - For each service, provide:
    - title
    - description (1-2 clear, compelling sentences)
    - benefits (array of 2 short benefits, e.g., ["Virtually pain-free", "Completed in 1 visit"])
    - whoNeedsIt (a brief sentence describing who needs this service)
    
  INSTRUCTIONS FOR GALLERY:
  - Generate a title, subtitle, and an array of 6 descriptive imageLabels (e.g., ["Modern Treatment Room", "Comfort Lounge", "Advanced Dental Scanning"]) representing typical views/spaces/activities of this business category.
  
  Return ONLY valid JSON matching this structure:
  {
    "home": {
      "heroTitle": "...",
      "heroSubtitle": "...",
      "heroCta": "..."
    },
    "about": {
      "headline": "...",
      "story": "... (3-4 sentences about the business's mission, legacy, highlighting keyPeople if present)",
      "mission": "... (a single powerful mission statement)"
    },
    "whyChooseUs": [
      { "title": "... (e.g. 'Pain-Free Technology')", "description": "..." },
      { "title": "... (e.g. 'Experienced Specialists')", "description": "..." },
      { "title": "... (e.g. 'Transparent Pricing')", "description": "..." }
    ],
    "services": [
      { "title": "...", "description": "...", "benefits": ["...", "..."], "whoNeedsIt": "..." },
      { "title": "...", "description": "...", "benefits": ["...", "..."], "whoNeedsIt": "..." },
      { "title": "...", "description": "...", "benefits": ["...", "..."], "whoNeedsIt": "..." },
      { "title": "...", "description": "...", "benefits": ["...", "..."], "whoNeedsIt": "..." },
      { "title": "...", "description": "...", "benefits": ["...", "..."], "whoNeedsIt": "..." }
    ],
    "reviews": [
      { "author": "...", "text": "...", "company": "Google Review" },
      { "author": "...", "text": "...", "company": "Google Review" },
      { "author": "...", "text": "...", "company": "Google Review" }
    ],
    "gallery": {
      "title": "Our Space & Work",
      "subtitle": "Take a virtual tour of our premium facilities and team in action.",
      "imageLabels": ["...", "...", "...", "...", "...", "..."]
    },
    "contact": {
      "headline": "... (max 4 words)",
      "tagline": "... (max 12 words)"
    }
  }
  `;

  const textResult = await callLLM(prompt, 'json');
  try {
    const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error('[CopywriterAgent] JSON Parse Error:', err, textResult);
    throw new Error('Failed to parse sales copy JSON');
  }
}

// ===================== AGENT 3: THE CODER =====================
// ===================== AGENT 3: THE CODER =====================
function generateWebsiteCode(lead, strategy, copy, images) {
  console.log(`[CoderAgent] 🧑‍💻 Assembling multi-page Astro application programmatically...`);
  
  const businessName = getBizName(lead);
  const phone = lead.phone || 'N/A';
  const address = lead.address || lead.city || 'N/A';
  
  // Extract clean business name for visual UI (header logo, footer, etc.)
  let cleanBizName = businessName;
  const separators = [/\|/, / - /, /:/];
  for (const sep of separators) {
    if (sep.test(businessName)) {
      cleanBizName = businessName.split(sep)[0].trim();
      break;
    }
  }

  // Detect if phone is Indian or suitable for WhatsApp
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const isIndianPhone = cleanPhone.startsWith('91') || phone.startsWith('+91') || cleanPhone.length === 10;
  const enableWhatsApp = isIndianPhone && cleanPhone.length >= 10;
  const waUrlPhone = cleanPhone.startsWith('91') || cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone}`;
  
  const layoutAstro = `---
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
interface Props { title: string; }
const { title } = Astro.props;
const businessName = "${businessName}";
const cleanBizName = "${cleanBizName}";
const phone = "${phone}";
const address = "${address}";
const navLinks = [
  { name: 'Home', href: import.meta.env.BASE_URL },
  { name: 'About', href: import.meta.env.BASE_URL + 'about' },
  { name: 'Services', href: import.meta.env.BASE_URL + 'services' },
  { name: 'Reviews', href: import.meta.env.BASE_URL + 'reviews' },
  { name: 'Gallery', href: import.meta.env.BASE_URL + 'gallery' },
  { name: 'Book Now', href: import.meta.env.BASE_URL + 'book' },
  { name: 'Contact', href: import.meta.env.BASE_URL + 'contact' },
];
const enableWhatsApp = ${enableWhatsApp};
const waUrlPhone = "${waUrlPhone}";
const copy = ${JSON.stringify(copy)};
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href={import.meta.env.BASE_URL + 'favicon.svg'} />
    <title>{title} | {businessName}</title>
    <meta name="description" content={\`\${title} - \${businessName}. Premium services at \${address}.\`} />
    <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="${strategy.fontLink}" rel="stylesheet">
    <ClientRouter />
    <style is:inline>
      :root {
        --primary: ${strategy.colors.primary};
        --primary-light: ${strategy.colors.primaryLight};
        --primary-dark: ${strategy.colors.primaryDark};
        --accent: ${strategy.colors.accent};
        --bg-main: ${strategy.colors.bg};
        --bg-sec: ${strategy.colors.bgSecondary};
        --text-main: ${strategy.colors.text};
        --text-sec: ${strategy.colors.textSecondary};
      }
    </style>
  </head>
  <body class="bg-[var(--bg-main)] text-[var(--text-main)] ${strategy.fontFamilyBody || 'font-sans'} antialiased selection:bg-[var(--primary)] selection:text-white transition-colors duration-300">
    <header class="sticky top-0 z-50 bg-[var(--bg-main)]/90 backdrop-blur-md border-b border-[var(--text-main)]/5 shadow-sm">
      <nav class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <a href={import.meta.env.BASE_URL} class="text-xl md:text-2xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--primary)] tracking-wide truncate mr-4">{cleanBizName}</a>
        
        <ul class="hidden xl:flex space-x-8">
          {navLinks.map((link) => (
            <li><a href={link.href} class="text-sm font-semibold text-[var(--text-sec)] hover:text-[var(--primary)] transition-colors duration-200">{link.name}</a></li>
          ))}
        </ul>

        <div class="hidden xl:flex items-center gap-6">
          <a href={\`tel:\${phone}\`} class="flex items-center gap-2 text-sm font-semibold text-[var(--text-main)] hover:text-[var(--primary)] transition-colors">
            <svg class="w-4 h-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {phone}
          </a>
          <a href={import.meta.env.BASE_URL + 'book'} class="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            Book Appointment
          </a>
        </div>

        <button id="mobile-menu-btn" class="xl:hidden flex flex-col gap-1.5 p-2 -mr-2 text-[var(--text-main)]" aria-label="Toggle menu">
          <span class="block w-6 h-0.5 bg-current transition-transform" id="bar1"></span>
          <span class="block w-6 h-0.5 bg-current transition-opacity" id="bar2"></span>
          <span class="block w-6 h-0.5 bg-current transition-transform" id="bar3"></span>
        </button>
      </nav>
      <div id="mobile-menu" class="hidden xl:hidden bg-[var(--bg-main)] border-t border-[var(--text-main)]/5 shadow-inner">
        <ul class="flex flex-col px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <li><a href={link.href} class="text-lg font-semibold text-[var(--text-sec)] hover:text-[var(--primary)] transition-colors block py-2">{link.name}</a></li>
          ))}
          <li class="pt-4 border-t border-[var(--text-main)]/5 flex flex-col gap-4">
            <a href={\`tel:\${phone}\`} class="flex items-center gap-2 text-base font-semibold text-[var(--text-main)] hover:text-[var(--primary)]">
              <svg class="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {phone}
            </a>
            <a href={import.meta.env.BASE_URL + 'book'} class="inline-flex items-center justify-center px-5 py-3 text-base font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-dark)] rounded-xl transition-colors text-center w-full">
              Book Appointment
            </a>
          </li>
        </ul>
      </div>
    </header>
    <main><slot /></main>
    <footer class="bg-[var(--bg-sec)] border-t border-[var(--text-main)]/5 py-16 mt-24">
      <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div class="space-y-4">
          <p class="text-xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--primary)]">{cleanBizName}</p>
          <p class="text-sm text-[var(--text-sec)] leading-relaxed">Delivering premium, high-quality professional services tailored to your individual needs.</p>
        </div>
        <div class="space-y-4">
          <h4 class="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">Quick Links</h4>
          <ul class="space-y-2">
            {navLinks.slice(0, 5).map(link => (
              <li><a href={link.href} class="text-sm text-[var(--text-sec)] hover:text-[var(--primary)] transition-colors">{link.name}</a></li>
            ))}
          </ul>
        </div>
        <div class="space-y-4">
          <h4 class="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">Services</h4>
          <ul class="space-y-2">
            {copy.services.slice(0, 4).map((s) => (
              <li><a href={import.meta.env.BASE_URL + 'services'} class="text-sm text-[var(--text-sec)] hover:text-[var(--primary)] transition-colors">{s.title}</a></li>
            ))}
          </ul>
        </div>
        <div class="space-y-4">
          <h4 class="text-sm font-bold uppercase tracking-wider text-[var(--text-main)]">Contact</h4>
          <ul class="space-y-3">
            <li class="flex items-start gap-3 text-sm text-[var(--text-sec)]">
              <svg class="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{address}</span>
            </li>
            <li class="flex items-center gap-3 text-sm text-[var(--text-sec)]">
              <svg class="w-5 h-5 text-[var(--primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <a href={\`tel:\${phone}\`} class="hover:text-[var(--primary)] transition-colors">{phone}</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>

    <!-- Floating WhatsApp FAB -->
    {enableWhatsApp && (
      <a
        href={\`https://wa.me/\${waUrlPhone}?text=Hi,%20I'm%20interested%20in%20your%20services.\`}
        target="_blank"
        rel="noopener noreferrer"
        class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group animate-bounce-slow"
        aria-label="Chat on WhatsApp"
      >
        <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zM6.597 17.585l.389.231c1.554.922 3.356 1.409 5.187 1.409 5.568.001 10.101-4.531 10.101-10.101-.001-5.569-4.532-10.102-10.101-10.102-5.568 0-10.101 4.533-10.101 10.102 0 1.834.488 3.636 1.41 5.189l.231.39-1.008 3.684 3.685-1.008z"/></svg>
      </a>
    )}

    <script>
      document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
        const menu = document.getElementById('mobile-menu');
        menu?.classList.toggle('hidden');
      });
    </script>
  </body>
</html>`;

  const indexAstro = `---
import Layout from '../layouts/Layout.astro';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
const phone = "${phone}";
const heroImage = images[0] || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80';
---
<Layout title="Home">
  <section class="relative overflow-hidden py-20 lg:py-32 bg-[var(--bg-main)]">
    <div class="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
      <!-- Left Column: Content -->
      <div class="flex flex-col items-start text-left space-y-8 max-w-2xl animate-fade-in">
        <!-- Floating Badge -->
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-light)] text-[var(--primary-dark)] text-xs font-bold uppercase tracking-wider border border-[var(--primary)]/10">
          <span class="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
          5.0 ⭐ Premium Rated Clinic
        </div>
        
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)] leading-[1.15]">
          {copy.home.heroTitle}
        </h1>
        
        <p class="text-base md:text-lg text-[var(--text-sec)] leading-relaxed font-light">
          {copy.home.heroSubtitle}
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <a
            href={import.meta.env.BASE_URL + 'book'}
            class="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-base font-bold rounded-full text-center transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
          >
            {copy.home.heroCta}
          </a>
          <a
            href={import.meta.env.BASE_URL + 'services'}
            class="px-8 py-4 bg-[var(--bg-sec)] hover:bg-[var(--primary-light)] text-[var(--text-main)] border border-[var(--text-main)]/10 text-base font-bold rounded-full text-center transition-all"
          >
            Explore Services
          </a>
        </div>

        <!-- Trust Badges -->
        <div class="pt-6 border-t border-[var(--text-main)]/5 w-full flex flex-wrap gap-8 text-[var(--text-sec)]">
          <div>
            <span class="block text-2xl font-bold text-[var(--primary)]">100%</span>
            <span class="text-xs">Satisfaction Guaranteed</span>
          </div>
          <div>
            <span class="block text-2xl font-bold text-[var(--primary)]">5.0 ⭐</span>
            <span class="text-xs">Based on 43 Google Reviews</span>
          </div>
        </div>
      </div>
      
      <!-- Right Column: Image and overlays -->
      <div class="relative w-full">
        <!-- Main Image Container -->
        <div class="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 bg-[var(--bg-sec)] aspect-[4/3] md:aspect-[16/10] lg:aspect-[4/3]">
          <img src={heroImage} alt="Premium Service" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
        </div>
        
        <!-- Background decorative glow -->
        <div class="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-[var(--primary)]/10 blur-[80px] -z-10 pointer-events-none"></div>
        <div class="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-[var(--accent)]/10 blur-[80px] -z-10 pointer-events-none"></div>
        
        <!-- Floating badge overlay -->
        <div class="absolute -bottom-6 -right-6 z-20 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-2xl border border-slate-100 dark:border-zinc-800 flex items-center gap-3 animate-bounce-slow">
          <div class="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center">
            <svg class="w-5 h-5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-slate-400">Verified Quality</p>
            <p class="text-sm font-bold text-slate-900 dark:text-white">Trusted Experts</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Why Choose Us Section */}
  <section class="py-24 px-6 border-t border-[var(--text-main)]/5 bg-[var(--bg-sec)]">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16 max-w-2xl mx-auto space-y-4">
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Why Choose Us</h2>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)] leading-relaxed">We stand out by delivering custom quality and unmatched value tailored to your precise needs.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {copy.whyChooseUs.map((item, idx) => (
          <div class="p-8 rounded-2xl bg-[var(--bg-main)] border border-[var(--text-main)]/5 hover:border-[var(--primary)]/30 hover:-translate-y-1.5 transition-all duration-300 shadow-sm hover:shadow-md">
            <div class="w-12 h-12 rounded-full bg-[var(--primary-light)] flex items-center justify-center mb-6">
              {idx === 0 && (
                <svg class="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              )}
              {idx === 1 && (
                <svg class="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {idx >= 2 && (
                <svg class="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </div>
            <h3 class="text-xl font-bold text-[var(--text-main)] mb-3 ${strategy.fontFamilyHeading || 'font-serif'}">{item.title}</h3>
            <p class="text-[var(--text-sec)] text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* Services Preview Section */}
  <section class="py-24 px-6 bg-[var(--bg-main)]">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16 max-w-2xl mx-auto space-y-4">
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Our Services</h2>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)]">Premium, professional solutions designed to deliver exceptional value.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {copy.services.slice(0, 3).map((service, i) => {
          const serviceImg = images[(i + 1) % images.length] || images[0];
          return (
            <div class="group flex flex-col bg-[var(--bg-sec)] rounded-2xl overflow-hidden border border-[var(--text-main)]/5 hover:border-[var(--primary)]/20 shadow-sm hover:shadow-lg transition-all duration-300">
              <div class="h-56 overflow-hidden relative">
                <img src={serviceImg} alt={service.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-sec)] via-transparent to-transparent opacity-60"></div>
              </div>
              <div class="p-8 flex flex-col flex-grow justify-between space-y-6">
                <div class="space-y-3">
                  <h3 class="text-2xl font-bold text-[var(--text-main)] ${strategy.fontFamilyHeading || 'font-serif'} group-hover:text-[var(--primary)] transition-colors">{service.title}</h3>
                  <p class="text-[var(--text-sec)] text-sm leading-relaxed line-clamp-3">{service.description}</p>
                </div>
                
                {service.benefits && (
                  <ul class="space-y-2 pt-2 border-t border-[var(--text-main)]/5">
                    {service.benefits.slice(0, 2).map((benefit) => (
                      <li class="flex items-center text-sm text-[var(--text-sec)] gap-2">
                        <svg class="w-4 h-4 text-[var(--primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span class="truncate">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <a href={import.meta.env.BASE_URL + 'services'} class="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-dark)] group/link transition-colors pt-2">
                  Learn More
                  <svg class="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          );
        })}
      </div>
      <div class="text-center mt-12">
        <a href={import.meta.env.BASE_URL + 'services'} class="inline-flex items-center justify-center px-8 py-3.5 border border-[var(--primary)] hover:bg-[var(--primary-light)] text-[var(--primary-dark)] font-bold rounded-full transition-all">
          View All Services
        </a>
      </div>
    </div>
  </section>

  {/* Client Testimonials Section */}
  <section class="py-24 px-6 bg-[var(--bg-sec)]">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-16 max-w-2xl mx-auto space-y-4">
        <h2 class="text-3xl md:text-4xl font-bold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Client Reviews</h2>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)]">Don't take our word for it. Read honest feedback from our valued clients.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {copy.reviews.slice(0, 3).map((review) => {
          const initial = (review.author || 'C').charAt(0);
          return (
            <div class="p-8 rounded-2xl bg-[var(--bg-main)] border border-[var(--text-main)]/5 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div class="space-y-4">
                {/* 5 Stars */}
                <div class="flex gap-1 text-[var(--accent)]">
                  {[...Array(5)].map(() => (
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p class="text-[var(--text-sec)] text-sm italic leading-relaxed">"{review.text}"</p>
              </div>
              <div class="flex items-center gap-3 pt-4 border-t border-[var(--text-main)]/5">
                <div class="w-10 h-10 rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center text-sm shadow-inner">{initial}</div>
                <div>
                  <h4 class="text-sm font-bold text-[var(--text-main)]">{review.author}</h4>
                  <p class="text-xs text-[var(--text-sec)]">{review.company || 'Verified Customer'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div class="text-center mt-12">
        <a href={import.meta.env.BASE_URL + 'reviews'} class="inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors">
          Read All Reviews
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  </section>

  {/* Dynamic conversion band CTA */}
  <section class="py-20 px-6 text-center bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white relative overflow-hidden">
    <div class="max-w-4xl mx-auto space-y-8 relative z-10">
      <h2 class="text-3xl md:text-5xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} drop-shadow-md">
        Ready to Experience the Difference?
      </h2>
      <p class="text-white/80 max-w-xl mx-auto text-base md:text-lg">
        Secure your booking online in seconds or give us a call to speak with our experts.
      </p>
      <div class="flex flex-col sm:flex-row justify-center items-center gap-4">
        <a href={import.meta.env.BASE_URL + 'book'} class="w-full sm:w-auto px-8 py-4 bg-white text-[var(--primary-dark)] hover:bg-slate-50 font-bold rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 animate-pulse-slow">
          Schedule Appointment
        </a>
        <a href={\`tel:\${phone}\`} class="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/10 text-white border border-white/30 font-bold rounded-full transition-all">
          Call {phone}
        </a>
      </div>
    </div>
    {/* Floating background decorative shape */}
    <div class="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/5 blur-[50px]"></div>
    <div class="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-white/5 blur-[50px]"></div>
  </section>
</Layout>`;

  const aboutAstro = `---
import Layout from '../layouts/Layout.astro';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
const aboutImage = images[1] || images[0] || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80';
---
<Layout title="About Us">
  <section class="py-20 lg:py-28 bg-[var(--bg-main)]">
    <div class="max-w-7xl mx-auto px-6 space-y-20 animate-fade-in">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)] leading-tight">
          {copy.about.headline}
        </h1>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
      </div>

      <!-- Main Layout Split -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <!-- Story -->
        <div class="space-y-8">
          <div class="p-8 md:p-10 rounded-2xl bg-[var(--bg-sec)] border border-[var(--text-main)]/5 shadow-sm space-y-6">
            <h2 class="text-2xl md:text-3xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--primary)]">Our Story</h2>
            <p class="text-[var(--text-sec)] leading-relaxed text-pretty text-base font-light">{copy.about.story}</p>
            
            <!-- Dynamic highlights -->
            <ul class="space-y-3 pt-4 border-t border-[var(--text-main)]/5">
              <li class="flex items-center gap-3 text-sm text-[var(--text-main)] font-medium">
                <svg class="w-5 h-5 text-[var(--primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                State-of-the-Art Professional Facilities
              </li>
              <li class="flex items-center gap-3 text-sm text-[var(--text-main)] font-medium">
                <svg class="w-5 h-5 text-[var(--primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Highly Trained & Experienced Staff
              </li>
              <li class="flex items-center gap-3 text-sm text-[var(--text-main)] font-medium">
                <svg class="w-5 h-5 text-[var(--primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Patient-Centric Approach to Quality Care
              </li>
            </ul>
          </div>
        </div>

        <!-- Visuals and Mission -->
        <div class="space-y-8">
          <div class="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-zinc-800 bg-[var(--bg-sec)] aspect-[16/10] group">
            <img src={aboutImage} alt="Our team and facility" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)]/30 to-transparent"></div>
          </div>
          
          <div class="p-8 rounded-2xl bg-gradient-to-r from-[var(--primary)]/10 to-[var(--primary-dark)]/5 border-l-4 border-[var(--primary)] shadow-sm">
            <h3 class="text-lg font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--primary-dark)] mb-2 uppercase tracking-wide">Our Mission</h3>
            <p class="text-[var(--text-main)] leading-relaxed text-lg font-medium">{copy.about.mission}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</Layout>`;

  const servicesAstro = `---
import Layout from '../layouts/Layout.astro';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
---
<Layout title="Our Services">
  <section class="py-20 lg:py-28 bg-[var(--bg-main)]">
    <div class="max-w-7xl mx-auto px-6 space-y-20 animate-fade-in">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Our Services</h1>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)] text-base md:text-lg leading-relaxed">Discover our collection of premium, professional services designed to deliver exceptional value.</p>
      </div>

      <!-- Services List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {copy.services.map((service, i) => {
          const serviceImg = images[(i + 2) % images.length] || images[0];
          return (
            <div class="group flex flex-col bg-[var(--bg-sec)] rounded-2xl overflow-hidden border border-[var(--text-main)]/5 hover:border-[var(--primary)]/20 shadow-sm hover:shadow-lg transition-all duration-300">
              <div class="h-60 overflow-hidden relative">
                <img src={serviceImg} alt={service.title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-sec)] via-transparent to-transparent opacity-60"></div>
              </div>
              <div class="p-8 flex flex-col flex-grow justify-between space-y-6">
                <div class="space-y-3">
                  <div class="flex justify-between items-start gap-2">
                    <h3 class="text-xl md:text-2xl font-bold text-[var(--text-main)] ${strategy.fontFamilyHeading || 'font-serif'} group-hover:text-[var(--primary)] transition-colors">{service.title}</h3>
                    {service.whoNeedsIt && (
                      <span class="text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 bg-[var(--primary-light)] text-[var(--primary-dark)] rounded-full border border-[var(--primary)]/10">{service.whoNeedsIt.split(' ')[0]}</span>
                    )}
                  </div>
                  <p class="text-[var(--text-sec)] text-sm leading-relaxed">{service.description}</p>
                </div>
                
                {service.benefits && (
                  <ul class="space-y-2 pt-4 border-t border-[var(--text-main)]/5">
                    {service.benefits.map((benefit) => (
                      <li class="flex items-center text-sm text-[var(--text-sec)] gap-2">
                        <svg class="w-4 h-4 text-[var(--primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <a href={import.meta.env.BASE_URL + 'book'} class="inline-flex items-center justify-center w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white text-sm font-bold rounded-xl transition-all shadow-sm group-hover:shadow-md">
                  Book Service
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <!-- Bottom CTA Section -->
      <div class="p-8 md:p-12 rounded-2xl bg-[var(--bg-sec)] border border-[var(--text-main)]/5 text-center max-w-4xl mx-auto space-y-6">
        <h3 class="text-2xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Not sure which service is right for you?</h3>
        <p class="text-[var(--text-sec)] max-w-xl mx-auto text-sm leading-relaxed">Book a consultation session with our certified specialists to receive a customized treatment plan tailored to your needs.</p>
        <div class="pt-4">
          <a href={import.meta.env.BASE_URL + 'book'} class="inline-flex items-center justify-center px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold rounded-full transition-all shadow-md">
            Request a Consultation
          </a>
        </div>
      </div>
    </div>
  </section>
</Layout>`;

  const reviewsPageAstro = `---
import Layout from '../layouts/Layout.astro';
const copy = ${JSON.stringify(copy)};
---
<Layout title="Client Reviews">
  <section class="py-20 lg:py-28 bg-[var(--bg-main)]">
    <div class="max-w-7xl mx-auto px-6 space-y-16 animate-fade-in">
      <!-- Header -->
      <div class="text-center max-w-2xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Client Reviews</h1>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)] text-base md:text-lg">Honest feedback and testimonials from our valued patients.</p>
      </div>

      <!-- Reviews Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {copy.reviews.map((review) => {
          const initial = (review.author || 'C').charAt(0);
          return (
            <div class="p-8 rounded-2xl bg-[var(--bg-sec)] border border-[var(--text-main)]/5 flex flex-col justify-between space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div class="space-y-4">
                {/* 5 Stars */}
                <div class="flex gap-1 text-[var(--accent)]">
                  {[...Array(5)].map(() => (
                    <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p class="text-[var(--text-sec)] text-sm italic leading-relaxed">"{review.text}"</p>
              </div>
              <div class="flex items-center gap-3 pt-4 border-t border-[var(--text-main)]/5">
                <div class="w-10 h-10 rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center text-sm shadow-inner">{initial}</div>
                <div>
                  <h4 class="text-sm font-bold text-[var(--text-main)]">{review.author}</h4>
                  <p class="text-xs text-[var(--text-sec)]">{review.company || 'Google Review'}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
</Layout>`;

  const galleryPageAstro = `---
import Layout from '../layouts/Layout.astro';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
---
<Layout title="Gallery">
  <section class="py-20 lg:py-28 bg-[var(--bg-main)]">
    <div class="max-w-7xl mx-auto px-6 space-y-16 animate-fade-in">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">
          {copy.gallery.title}
        </h1>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)] text-base md:text-lg max-w-2xl mx-auto">{copy.gallery.subtitle}</p>
      </div>

      <!-- Masonry Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.slice(0, 6).map((image, idx) => {
          const label = copy.gallery.imageLabels[idx % copy.gallery.imageLabels.length] || "Our Facility";
          return (
            <div class="group relative rounded-2xl overflow-hidden bg-[var(--bg-sec)] border border-[var(--text-main)]/5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div class="h-64 overflow-hidden relative">
                <img src={image} alt={label} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-[var(--bg-main)]/60 via-[var(--bg-main)]/10 to-transparent opacity-80"></div>
              </div>
              <div class="p-6">
                <h3 class="text-lg font-bold text-[var(--text-main)] tracking-wide group-hover:text-[var(--primary)] transition-colors">{label}</h3>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </section>
</Layout>`;

  const businessEmail = lead.email || lead.website ? `info@${(lead.website || '').replace(/^https?:\/\//, '').split('/')[0]}` : '';
  const contactAstro = `---
import Layout from '../layouts/Layout.astro';
const copy = ${JSON.stringify(copy)};
const phone = "${phone}";
const address = "${address}";
const email = "${businessEmail}";
---
<Layout title="Contact Us">
  <section class="py-20 lg:py-28 bg-[var(--bg-main)]">
    <div class="max-w-7xl mx-auto px-6 space-y-16 animate-fade-in">
      <!-- Header -->
      <div class="text-center max-w-3xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)] leading-tight">
          {copy.contact.headline || "Get In Touch"}
        </h1>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)] text-base md:text-lg max-w-2xl mx-auto">
          {copy.contact.tagline || "We'd love to hear from you. Reach out and let's start a conversation."}
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <!-- Contact Form -->
        <div class="p-8 md:p-10 rounded-2xl bg-[var(--bg-sec)] border border-[var(--text-main)]/5 shadow-sm space-y-6">
          <h3 class="text-2xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Send a Message</h3>
          <form class="space-y-4">
            <div>
              <label for="name" class="block text-sm font-semibold text-[var(--text-main)] mb-1">Your Name</label>
              <input type="text" id="name" required class="w-full px-4 py-3 rounded-xl border border-[var(--text-main)]/10 bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" />
            </div>
            <div>
              <label for="email" class="block text-sm font-semibold text-[var(--text-main)] mb-1">Email Address</label>
              <input type="email" id="email" required class="w-full px-4 py-3 rounded-xl border border-[var(--text-main)]/10 bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" />
            </div>
            <div>
              <label for="phone" class="block text-sm font-semibold text-[var(--text-main)] mb-1">Phone Number</label>
              <input type="tel" id="phone" class="w-full px-4 py-3 rounded-xl border border-[var(--text-main)]/10 bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all" />
            </div>
            <div>
              <label for="message" class="block text-sm font-semibold text-[var(--text-main)] mb-1">Message</label>
              <textarea id="message" rows="4" required class="w-full px-4 py-3 rounded-xl border border-[var(--text-main)]/10 bg-[var(--bg-main)] text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"></textarea>
            </div>
            <button type="submit" class="w-full py-4 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white font-bold rounded-xl transition-all shadow-md">
              Send Message
            </button>
          </form>
        </div>

        <!-- Contact Info & Map -->
        <div class="space-y-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="p-6 rounded-2xl bg-[var(--bg-sec)] border border-[var(--text-main)]/5 flex gap-4 items-start shadow-sm">
              <div class="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0 text-[var(--primary-dark)]">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-bold text-[var(--text-main)] mb-1">Hours</h4>
                <p class="text-xs text-[var(--text-sec)]">Mon - Sat</p>
                <p class="text-xs text-[var(--text-sec)]">9 AM - 7 PM</p>
              </div>
            </div>

            <div class="p-6 rounded-2xl bg-[var(--bg-sec)] border border-[var(--text-main)]/5 flex gap-4 items-start shadow-sm">
              <div class="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0 text-[var(--primary-dark)]">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h4 class="text-sm font-bold text-[var(--text-main)] mb-1">Call Us</h4>
                <a href={\`tel:\${phone}\`} class="text-xs text-[var(--text-sec)] hover:text-[var(--primary)] transition-colors">{phone}</a>
              </div>
            </div>
          </div>

          <div class="p-6 rounded-2xl bg-[var(--bg-sec)] border border-[var(--text-main)]/5 flex gap-4 items-start shadow-sm">
            <div class="w-10 h-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center flex-shrink-0 text-[var(--primary-dark)]">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-bold text-[var(--text-main)] mb-1">Address</h4>
              <p class="text-xs text-[var(--text-sec)] leading-relaxed">{address}</p>
            </div>
          </div>

          <!-- Google Maps Embed -->
          <div class="rounded-2xl overflow-hidden border border-[var(--text-main)]/5 h-64 w-full shadow-sm bg-[var(--bg-sec)]">
            <iframe
              width="100%"
              height="100%"
              style="border:0"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
              src={\`https://maps.google.com/maps?q=\${encodeURIComponent(address)}&t=&z=14&ie=UTF8&iwloc=&output=embed\`}
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </section>
</Layout>`;

  const bookAstro = `---
import Layout from '../layouts/Layout.astro';
import { BookingForm } from '../components/ui/BookingForm.jsx';
const copy = ${JSON.stringify(copy)};
const phone = "${phone}";
---
<Layout title="Book Appointment">
  <section class="py-20 lg:py-28 bg-[var(--bg-main)] min-h-[85vh] flex flex-col justify-center">
    <div class="max-w-4xl mx-auto w-full px-6 space-y-12 animate-fade-in">
      <div class="text-center max-w-2xl mx-auto space-y-4">
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight ${strategy.fontFamilyHeading || 'font-serif'} text-[var(--text-main)]">Book an Appointment</h1>
        <div class="w-16 h-1 bg-[var(--primary)] mx-auto rounded-full"></div>
        <p class="text-[var(--text-sec)] text-sm md:text-base leading-relaxed">Secure your slot in seconds. Select a service, pick your preferred date and time, and we'll handle the rest.</p>
      </div>
      <div class="bg-[var(--bg-sec)] p-6 md:p-10 rounded-2xl border border-[var(--text-main)]/5 shadow-xl">
        <BookingForm services={copy.services} primaryColor="${strategy.colors.primary}" businessPhone={phone} client:load />
      </div>
    </div>
  </section>
</Layout>`;

  return {
    'src/layouts/Layout.astro': layoutAstro,
    'src/pages/index.astro': indexAstro,
    'src/pages/about.astro': aboutAstro,
    'src/pages/services.astro': servicesAstro,
    'src/pages/reviews.astro': reviewsPageAstro,
    'src/pages/gallery.astro': galleryPageAstro,
    'src/pages/book.astro': bookAstro,
    'src/pages/contact.astro': contactAstro
  };
}

// ===================== MAIN EXPORT: buildAndDeployAgentSite =====================
export async function buildAndDeployAgentSite(lead) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`[BuilderAgent] 🚀 Starting Smart Builder for ${getBizName(lead)}...`);
      
      const llmProvider = process.env.LLM_PROVIDER || 'gemini';
      if (llmProvider === 'groq') {
        if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing');
      } else if (llmProvider === 'grok' || llmProvider === 'xai') {
        if (!process.env.GROK_API_KEY && !process.env.XAI_API_KEY) throw new Error('GROK_API_KEY or XAI_API_KEY is missing');
      } else {
        if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');
      }
      
      let safeBizName = (getBizName(lead))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');
      safeBizName = safeBizName.replace(/^-+|-+$/g, '');
      if (safeBizName.length > 60) {
        safeBizName = safeBizName.substring(0, 60).replace(/-+$/, '');
      }
      const deployId = `${safeBizName}-${lead.id || 'preview'}`;
      const projectDir = path.join(BUILD_DIR, deployId);
      const baseTemplateDir = path.join(TEMPLATES_DIR, 'astro-base');

      if (!fs.existsSync(baseTemplateDir)) {
        throw new Error('astro-base template not found in backend/templates/');
      }

      // 1. Copy Template (excluding node_modules to keep it fast)
      console.log(`[BuilderAgent] 📁 Copying base template to ${projectDir}...`);
      await fs.ensureDir(projectDir);
      
      // Clean up stale folders from previous builds while keeping .vercel configuration and node_modules symlink
      if (fs.existsSync(path.join(projectDir, 'src'))) {
        await fs.remove(path.join(projectDir, 'src'));
      }
      if (fs.existsSync(path.join(projectDir, 'public'))) {
        await fs.remove(path.join(projectDir, 'public'));
      }
      if (fs.existsSync(path.join(projectDir, 'dist'))) {
        await fs.remove(path.join(projectDir, 'dist'));
      }

      await fs.copy(baseTemplateDir, projectDir, {
        filter: (src) => !src.includes('node_modules')
      });

      // Symlink base node_modules if it exists to avoid running npm install
      const baseNodeModules = path.join(baseTemplateDir, 'node_modules');
      const targetNodeModules = path.join(projectDir, 'node_modules');
      if (fs.existsSync(baseNodeModules) && !fs.existsSync(targetNodeModules)) {
        console.log(`[BuilderAgent] 🔗 Symlinking node_modules from base template...`);
        await fs.symlink(baseNodeModules, targetNodeModules, 'dir');
      }

      // ===================== THE V3 AGENT PIPELINE =====================
      
      // Agent 0: Industry Classifier — classifies the business and extracts key details
      const industryInfo = await classifyIndustry(lead);
      console.log(`[ClassifierAgent] ✅ Macro Industry: ${industryInfo.macroIndustry}, Vibe: ${industryInfo.designVibe}, Key People: ${industryInfo.keyPeople || 'None'}`);

      // Agent 1: Director — decides visual identity
      const strategy = await generateBrandStrategy(lead, industryInfo);
      console.log(`[DirectorAgent] ✅ Theme: ${strategy.tailwindPrimaryColor}, Primary Hero Component: ${strategy.componentSelection.hero}`);

      // Agent 2: Copywriter — writes persuasive sales copy
      const copy = await generateSalesCopy(lead, industryInfo);
      console.log(`[CopywriterAgent] ✅ Generated persuasive copy for all pages.`);

      // Agent 3: Image Fetcher — real Google Photos + Unsplash + Curated fallback images
      console.log(`[ImageFetcher] 🔍 Hunting for real & premium images...`);
      const images = await getFinalImagesList(
        lead,
        (strategy.imageKeywords || []).join(' ') + ' ' + (lead.industry || lead.category || ''),
        industryInfo.macroIndustry,
        10
      );

      // Agent 4: Coder — assembles the Astro pages
      const generatedData = await generateWebsiteCode(lead, strategy, copy, images);

      // ===================== FILE INJECTION =====================
      console.log(`[BuilderAgent] 📝 Injecting code into Astro routing...`);
      for (const [filePath, content] of Object.entries(generatedData)) {
        const fullPath = path.join(projectDir, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
      }

      // ===================== CONFIG & BUILD =====================
      const configPath = path.join(projectDir, 'astro.config.mjs');
      const astroConfig = `// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.VERCEL ? '/' : '/demo-preview/${deployId}/dist',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] }
});`;
      await fs.writeFile(configPath, astroConfig);

      // Update package.json name to avoid Vercel scope conflicts
      const pkgPath = path.join(projectDir, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = await fs.readJson(pkgPath);
        pkg.name = deployId;
        await fs.writeJson(pkgPath, pkg, { spaces: 2 });
      }

      // Install Dependencies (only if node_modules was not symlinked)
      if (!fs.existsSync(path.join(projectDir, 'node_modules'))) {
        console.log(`[BuilderAgent] 📦 Installing dependencies (fallback)...`);
        await new Promise((res, rej) => {
          exec('npm install', { cwd: projectDir }, (err) => {
            if (err) return rej(err);
            res();
          });
        });
      }

      // Build the Astro site
      console.log(`[BuilderAgent] 🏗️ Building ultra-premium static site...`);
      await new Promise((res, rej) => {
        exec('npm run build', { cwd: projectDir }, (err, stdout, stderr) => {
          if (err) {
            console.error('[BuilderAgent] Build stderr:', stderr);
            return rej(err);
          }
          res();
        });
      });

      // ===================== DEPLOY =====================
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      const previewUrl = `${backendUrl}/demo-preview/${deployId}/dist`;

      const vercelToken = process.env.VERCEL_TOKEN;
      if (!vercelToken || vercelToken === 'your_vercel_token_here') {
        console.log(`[BuilderAgent] ✅ Build complete! Preview: ${previewUrl}`);
        return resolve(previewUrl);
      }

      console.log(`[BuilderAgent] ☁️ Deploying to Vercel...`);
      const deployCmd = `npx vercel --prod --yes --token ${vercelToken}`;
      
      exec(deployCmd, { cwd: projectDir }, (error, stdout, stderr) => {
        if (error) {
          console.warn('[BuilderAgent] ⚠️ Vercel Deploy with Token failed. Retrying without token using local session...');
          
          // Retry without token in environment
          const cleanEnv = { ...process.env };
          delete cleanEnv.VERCEL_TOKEN;
          
          exec('npx vercel --prod --yes', { cwd: projectDir, env: cleanEnv }, (retryError, retryStdout, retryStderr) => {
            if (retryError) {
              console.error('[BuilderAgent] ❌ Vercel Deploy fallback failed:', retryStderr);
              console.log(`[BuilderAgent] 🔄 Falling back to local preview.`);
              return resolve(previewUrl);
            }
            const url = parseVercelUrl(retryStdout + '\n' + retryStderr);
            resolve(url || previewUrl);
          });
          return;
        }
        const url = parseVercelUrl(stdout + '\n' + stderr);
        resolve(url || previewUrl);
      });

    } catch (error) {
      console.error('[BuilderAgent] ❌ Fatal Error:', error);
      reject(error);
    }
  });
}
