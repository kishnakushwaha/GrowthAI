import fetch from 'node-fetch';

/**
 * Fallback curated premium images if Unsplash API is not configured or hits limits.
 * These are hand-picked 4K+ images that look like $10k agency photos.
 */
const CURATED_FALLBACK_IMAGES = {
  'spa': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2000&auto=format&fit=crop',
  'massage': 'https://images.unsplash.com/photo-1600334129128-68505d48fc36?q=80&w=2000&auto=format&fit=crop',
  'dentist': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?q=80&w=2000&auto=format&fit=crop',
  'gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2000&auto=format&fit=crop',
  'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2000&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000&auto=format&fit=crop' // Luxury minimal office
};

export async function fetchPremiumImages(query, count = 1) {
  console.log(`[ImageFetcher] 📸 Searching for premium images matching: "${query}"...`);
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  
  if (apiKey) {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&client_id=${apiKey}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          return data.results.map(img => img.urls.regular);
        }
      }
      console.warn('[ImageFetcher] ⚠️ Unsplash API returned empty or failed. Using fallback.');
    } catch (e) {
      console.error('[ImageFetcher] ❌ Unsplash API error:', e.message);
    }
  } else {
    console.log('[ImageFetcher] ℹ️ No UNSPLASH_ACCESS_KEY found. Using curated fallback library.');
  }

  // Fallback Logic
  const lowercaseQuery = query.toLowerCase();
  let selectedUrl = CURATED_FALLBACK_IMAGES.default;
  
  for (const [key, url] of Object.entries(CURATED_FALLBACK_IMAGES)) {
    if (lowercaseQuery.includes(key)) {
      selectedUrl = url;
      break;
    }
  }

  // Return an array of the same URL (or slightly tweaked query strings) to fulfill the count
  return Array(count).fill(0).map((_, i) => `${selectedUrl}&sig=${i}`); 
}
