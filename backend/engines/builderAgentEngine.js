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
  
  Available Components:
  - Heros: HeroVideoBackground, HeroGlass, HeroWavy, HeroTracingBeam, HeroDarkMatter
  - Reviews: ReviewsInfiniteMarquee, ReviewsMasonry, ReviewsCards
  - Services: ServicesHoverReveal, ServicesBento, ServicesGlass
  - Contact: ContactSplit, ContactGlass, ContactMap

  Theme Color Guidelines:
  - trust_medical: emerald-600, blue-600, sky-500, or teal-500
  - emergency_home_service: amber-500, orange-500, or red-500
  - cozy_restaurant: orange-500, amber-600, or yellow-500
  - elegant_salon: rose-500, rose-600, violet-500, or fuchsia-500
  - active_gym: green-500, lime-500, sky-400, or red-600
  - professional_office: blue-600, indigo-600, or slate-400
  - default/generic: amber-500, sky-500
  
  Return ONLY valid JSON matching this exact structure:
  {
    "tailwindPrimaryColor": "emerald-600", 
    "tailwindBgColor": "zinc-950", 
    "fontLink": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@400;700&display=swap",
    "fontFamilyHeading": "font-['Outfit']",
    "fontFamilyBody": "font-['Plus_Jakarta_Sans']",
    "imageKeywords": ["modern dental clinic", "dentist operatory", "teeth whitening"],
    "componentSelection": {
      "hero": "HeroGlass",
      "services": "ServicesBento",
      "reviews": "ReviewsInfiniteMarquee",
      "contact": "ContactSplit"
    }
  }
  `;

  const textResult = await callLLM(prompt, 'json');
  try {
    const cleanedText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error('[DirectorAgent] JSON Parse Error:', err, textResult);
    throw new Error('Failed to parse brand strategy JSON');
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
  </head>
  <body class="bg-zinc-950 text-zinc-100 ${strategy.fontFamilyBody || 'font-sans'} antialiased selection:bg-${strategy.tailwindPrimaryColor || 'amber-500'} selection:text-black">
    <header class="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-white/5">
      <nav class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <a href={import.meta.env.BASE_URL} class="text-xl md:text-2xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-${strategy.tailwindPrimaryColor || 'amber-500'} tracking-wide truncate mr-4">{cleanBizName}</a>
        <ul class="hidden xl:flex space-x-8">
          {navLinks.map((link) => (
            <li><a href={link.href} class="text-sm font-medium text-zinc-300 hover:text-${strategy.tailwindPrimaryColor || 'amber-500'} transition-colors duration-200 rounded p-1">{link.name}</a></li>
          ))}
        </ul>
        <button id="mobile-menu-btn" class="xl:hidden flex flex-col gap-1.5 p-2 -mr-2" aria-label="Toggle menu">
          <span class="block w-6 h-0.5 bg-white transition-transform" id="bar1"></span>
          <span class="block w-6 h-0.5 bg-white transition-opacity" id="bar2"></span>
          <span class="block w-6 h-0.5 bg-white transition-transform" id="bar3"></span>
        </button>
      </nav>
      <div id="mobile-menu" class="hidden xl:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-white/5">
        <ul class="flex flex-col px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <li><a href={link.href} class="text-lg font-medium text-zinc-200 hover:text-${strategy.tailwindPrimaryColor || 'amber-500'} transition-colors block py-2">{link.name}</a></li>
          ))}
        </ul>
      </div>
    </header>
    <main><slot /></main>
    <footer class="bg-zinc-900/60 border-t border-white/5 py-12 mt-24">
      <div class="max-w-7xl mx-auto px-6 text-center grid gap-y-4 text-zinc-400">
        <p class="text-lg font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-white">{cleanBizName}</p>
        <address class="not-italic text-sm">{address}</address>
        <p class="text-sm">Call us: <a href={\`tel:\${phone}\`} class="text-${strategy.tailwindPrimaryColor || 'amber-500'} hover:underline">{phone}</a></p>
        <p class="text-xs text-zinc-600 mt-4">&copy; {new Date().getFullYear()} {cleanBizName}. All rights reserved.</p>
      </div>
    </footer>

    {/* Floating WhatsApp FAB */}
    {${enableWhatsApp} && (
      <a
        href={\`https://wa.me/${waUrlPhone}?text=Hi,%20I'm%20interested%20in%20your%20services.\`}
        target="_blank"
        rel="noopener noreferrer"
        class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group"
        aria-label="Chat on WhatsApp"
      >
        <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.03-5.115-2.908-6.995-1.878-1.88-4.357-2.912-6.997-2.914-5.443 0-9.866 4.42-9.871 9.866-.002 1.716.447 3.39 1.298 4.877L1.93 21.13l4.717-1.976zm11.378-5.305c-.328-.164-1.94-.959-2.242-1.07-.302-.11-.522-.164-.742.164-.22.329-.85.11-.85.11s-.577-.643-1.07-1.135c-.41-.41-.75-.863-.878-1.082-.128-.218-.014-.337.096-.445.099-.098.22-.258.329-.387.11-.13.146-.22.22-.365.074-.146.037-.274-.018-.384-.056-.11-.522-1.258-.716-1.724-.19-.456-.399-.393-.549-.4l-.467-.008c-.165 0-.434.062-.66.31-.225.249-.86.84-.86 2.048 0 1.208.879 2.376.999 2.54.12.164 1.73 2.642 4.19 3.706.585.253 1.042.404 1.398.517.589.187 1.125.161 1.549.098.473-.07 1.94-.793 2.213-1.52.274-.727.274-1.352.192-1.482-.08-.13-.302-.239-.63-.403z"/>
        </svg>
        <span class="absolute right-16 bg-zinc-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-xl">Chat with us</span>
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

  const heroComponent = strategy.componentSelection.hero;
  const reviewsComponent = (strategy.componentSelection.reviews === 'ReviewsMarquee' || strategy.componentSelection.reviews === 'ReviewsInfiniteMarquee')
    ? strategy.componentSelection.reviews
    : 'ReviewsInfiniteMarquee';
    
  const indexAstro = `---
import Layout from '../layouts/Layout.astro';
import { ${heroComponent} } from '../components/ui/${heroComponent}.jsx';
import { ${reviewsComponent} } from '../components/ui/${reviewsComponent}.jsx';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
---
<Layout title="Home">
  <${heroComponent} title={copy.home.heroTitle} subtitle={copy.home.heroSubtitle} cta={copy.home.heroCta} image={images[0]} client:load />
  
  <section class="py-24 px-6 border-t border-white/5 bg-zinc-950">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4">Why Choose Us</h2>
        <p class="text-zinc-400 max-w-2xl mx-auto leading-relaxed">We stand out by delivering custom quality and unmatched value tailored to your precise needs.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        {copy.whyChooseUs.map((item) => (
          <div class="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-${strategy.tailwindPrimaryColor || 'amber-500'}/30 transition-all duration-500 backdrop-blur-md">
            <h3 class="text-xl font-bold text-white mb-3 ${strategy.fontFamilyHeading || 'font-serif'}">{item.title}</h3>
            <p class="text-zinc-400 text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
  
  <section class="py-24 px-6 bg-zinc-900/40 border-t border-white/5">
    <div class="max-w-6xl mx-auto text-center">
      <h2 class="text-3xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-white mb-16">Client Testimonials</h2>
      <${reviewsComponent} reviews={copy.reviews} client:load />
    </div>
  </section>
</Layout>`;

  const aboutAstro = `---
import Layout from '../layouts/Layout.astro';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
---
<Layout title="About Us">
  <section class="py-24 px-6 bg-zinc-950 relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black -z-10"></div>
    <div class="max-w-6xl mx-auto">
      <h1 class="text-5xl md:text-7xl font-bold text-center ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-16 tracking-tight">{copy.about.headline}</h1>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div class="space-y-8">
          <div class="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-${strategy.tailwindPrimaryColor || 'amber-500'}/30 transition-all duration-500">
            <h2 class="text-3xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-${strategy.tailwindPrimaryColor || 'amber-500'} mb-4">Our Story</h2>
            <p class="text-zinc-300 leading-relaxed text-pretty">{copy.about.story}</p>
          </div>
        </div>
        <div class="space-y-8">
          <div class="relative rounded-3xl overflow-hidden group border border-white/10 shadow-2xl">
            <img src={images[1] || images[0]} alt="About Us" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
            <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          </div>
          <div class="p-8 rounded-3xl bg-zinc-900/80 border border-white/5 backdrop-blur-md">
            <h3 class="text-2xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-zinc-100 mb-2">Our Mission</h3>
            <p class="text-zinc-300 leading-relaxed text-pretty font-light">{copy.about.mission}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</Layout>`;

  const servicesComponent = strategy.componentSelection.services;
  const servicesAstro = `---
import Layout from '../layouts/Layout.astro';
import { ${servicesComponent} } from '../components/ui/${servicesComponent}.jsx';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
---
<Layout title="Our Services">
  <section class="py-24 px-6 bg-zinc-950">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h1 class="text-5xl md:text-7xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4 tracking-tight">Our Services</h1>
        <p class="text-zinc-400 max-w-2xl mx-auto leading-relaxed">Discover our collection of premium, professional services designed to deliver exceptional value.</p>
      </div>
      <${servicesComponent} services={copy.services.map((s, i) => ({ ...s, image: images[(i + 2) % images.length] }))} primaryColor="${strategy.tailwindPrimaryColor || 'emerald-600'}" client:load />
    </div>
  </section>

  <section class="py-24 px-6 bg-zinc-900/40 border-t border-white/5">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-white mb-4">Detailed Breakdown</h2>
        <p class="text-zinc-400">Everything you need to know about our specialized offerings.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        {copy.services.map((service) => (
          <div class="p-8 rounded-3xl bg-zinc-950 border border-white/5 flex flex-col justify-between hover:border-${strategy.tailwindPrimaryColor || 'amber-500'}/30 transition-all duration-300">
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h3 class="text-2xl font-semibold text-white ${strategy.fontFamilyHeading || 'font-serif'}">{service.title}</h3>
                {service.whoNeedsIt && (
                  <span class="text-xs font-medium px-3 py-1 bg-white/5 rounded-full text-zinc-400 w-fit">{service.whoNeedsIt}</span>
                )}
              </div>
              <p class="text-zinc-400 text-sm leading-relaxed mb-6">{service.description}</p>
              {service.benefits && (
                <ul class="space-y-2">
                  {service.benefits.map((benefit) => (
                    <li class="flex items-center text-sm text-zinc-300 gap-2">
                      <svg class="w-4 h-4 text-${strategy.tailwindPrimaryColor || 'amber-500'} flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
</Layout>`;

  const reviewsPageAstro = `---
import Layout from '../layouts/Layout.astro';
import { ReviewsMasonry } from '../components/ui/ReviewsMasonry.jsx';
const copy = ${JSON.stringify(copy)};
---
<Layout title="Customer Reviews">
  <section class="py-24 px-6 bg-zinc-950">
    <div class="max-w-6xl mx-auto space-y-16">
      <div class="text-center">
        <h1 class="text-5xl md:text-7xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4 tracking-tight">Client Reviews</h1>
        <p class="text-zinc-400 max-w-2xl mx-auto leading-relaxed">Don't take our word for it. Read honest feedback from our valued clients.</p>
      </div>
      <ReviewsMasonry reviews={copy.reviews} client:load />
    </div>
  </section>
</Layout>`;

  const galleryPageAstro = `---
import Layout from '../layouts/Layout.astro';
const images = ${JSON.stringify(images)};
const copy = ${JSON.stringify(copy)};
---
<Layout title="Gallery">
  <section class="py-24 px-6 bg-zinc-950">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h1 class="text-5xl md:text-7xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4 tracking-tight">{copy.gallery.title}</h1>
        <p class="text-zinc-400 max-w-2xl mx-auto leading-relaxed">{copy.gallery.subtitle}</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {images.slice(0, 6).map((image, idx) => {
          const label = copy.gallery.imageLabels[idx % copy.gallery.imageLabels.length] || "Our Facility";
          return (
            <div class="group relative rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-lg hover:border-${strategy.tailwindPrimaryColor || 'amber-500'}/30 transition-all duration-500">
              <div class="h-64 overflow-hidden relative">
                <img src={image} alt={label} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-60"></div>
              </div>
              <div class="p-6">
                <h3 class="text-lg font-semibold text-white tracking-wide">{label}</h3>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  </section>
</Layout>`;

  const contactComponent = strategy.componentSelection.contact;
  const businessEmail = lead.email || lead.website ? `info@${(lead.website || '').replace(/^https?:\/\//, '').split('/')[0]}` : '';
  const contactAstro = `---
import Layout from '../layouts/Layout.astro';
import { ${contactComponent} } from '../components/ui/${contactComponent}.jsx';
const copy = ${JSON.stringify(copy)};
const phone = "${phone}";
const address = "${address}";
const email = "${businessEmail}";
---
<Layout title="Contact Us">
  <section class="py-24 px-6 bg-zinc-950">
    <div class="max-w-6xl mx-auto space-y-16">
      <div class="text-center">
        <h1 class="text-5xl md:text-7xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4 tracking-tight">{copy.contact.headline || "Get In Touch"}</h1>
        <p class="text-zinc-400 max-w-2xl mx-auto leading-relaxed">{copy.contact.tagline || "We'd love to hear from you. Reach out and let's start a conversation."}</p>
      </div>
      <${contactComponent} title={copy.contact.headline || "Get In Touch"} phone={phone} address={address} email={email} primaryColor="${strategy.tailwindPrimaryColor || 'emerald-600'}" client:load />
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center hover:border-${strategy.tailwindPrimaryColor || 'amber-500'}/30 transition-all duration-500">
          <div class="w-12 h-12 rounded-full bg-${strategy.tailwindPrimaryColor || 'amber-500'}/10 flex items-center justify-center mx-auto mb-4">
            <svg class="w-5 h-5 text-${strategy.tailwindPrimaryColor || 'amber-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h4 class="text-white font-semibold mb-2">Business Hours</h4>
          <p class="text-zinc-400 text-sm">Mon - Fri: 9:00 AM - 7:00 PM</p>
          <p class="text-zinc-400 text-sm">Sat: 10:00 AM - 4:00 PM</p>
        </div>
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center hover:border-${strategy.tailwindPrimaryColor || 'amber-500'}/30 transition-all duration-500">
          <div class="w-12 h-12 rounded-full bg-${strategy.tailwindPrimaryColor || 'amber-500'}/10 flex items-center justify-center mx-auto mb-4">
            <svg class="w-5 h-5 text-${strategy.tailwindPrimaryColor || 'amber-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </div>
          <h4 class="text-white font-semibold mb-2">Phone</h4>
          <a href={\`tel:\${phone}\`} class="text-zinc-400 text-sm hover:text-white transition-colors">{phone}</a>
        </div>
        <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-center hover:border-${strategy.tailwindPrimaryColor || 'amber-500'}/30 transition-all duration-500">
          <div class="w-12 h-12 rounded-full bg-${strategy.tailwindPrimaryColor || 'amber-500'}/10 flex items-center justify-center mx-auto mb-4">
            <svg class="w-5 h-5 text-${strategy.tailwindPrimaryColor || 'amber-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h4 class="text-white font-semibold mb-2">Location</h4>
          <p class="text-zinc-400 text-sm">{address}</p>
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
  <section class="py-24 px-6 bg-zinc-950 relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black -z-10"></div>
    <div class="max-w-6xl mx-auto w-full space-y-12">
      <div class="text-center max-w-2xl mx-auto">
        <h1 class="text-5xl md:text-6xl font-bold ${strategy.fontFamilyHeading || 'font-serif'} text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-4 tracking-tight">Book an Appointment</h1>
        <p class="text-zinc-400 leading-relaxed">Secure your slot in seconds. Select a service, pick your preferred date and time, and we'll handle the rest.</p>
      </div>
      <BookingForm services={copy.services} primaryColor="${strategy.tailwindPrimaryColor || 'amber-500'}" businessPhone={phone} client:load />
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
