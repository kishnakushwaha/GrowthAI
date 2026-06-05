import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fetch from 'node-fetch';
import { fetchPremiumImages } from './fetchPremiumImages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const BUILD_DIR = path.join(__dirname, '..', '.demo-builds');

/**
 * Agent 1: The Brand Director
 */
async function generateBrandStrategy(lead, apiKey) {
  console.log(`[DirectorAgent] 🕴️ Formulating visual identity for ${lead.businessName}...`);
  const prompt = `
  You are an elite Brand Director for a high-end web design agency.
  Analyze this business and output a strict JSON strategy for their premium website.
  
  Business: ${lead.businessName}
  Industry: ${lead.industry} (${lead.category})
  Rating: ${lead.rating} Stars (${lead.user_ratings_total} reviews)
  Price Level: ${lead.price_level || 'N/A'}
  Location: ${lead.address}
  Vibe: Ultra-premium, sophisticated, trustworthy, and authoritative.
  
  Available Components:
  - Heros: HeroVideoBackground, HeroGlass, HeroWavy
  - Reviews: ReviewsInfiniteMarquee, ReviewsMasonry
  - Services: ServicesHoverReveal, ServicesBento
  - Contact: ContactSplit, ContactMap

  You MUST return ONLY valid JSON matching this exact structure:
  {
    "tailwindPrimaryColor": "amber-500", 
    "tailwindBgColor": "zinc-950", 
    "fontLink": "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@300;400;600&display=swap",
    "fontFamilyHeading": "font-['Cinzel']",
    "fontFamilyBody": "font-['Inter']",
    "imageKeywords": ["luxury modern architecture", "dark elegant interior", "high end sophisticated minimal"],
    "componentSelection": {
      "hero": "HeroVideoBackground",
      "services": "ServicesHoverReveal",
      "reviews": "ReviewsInfiniteMarquee",
      "contact": "ContactSplit"
    }
  }
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } })
  });
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

/**
 * Agent 2: The Copywriter
 */
async function generateSalesCopy(lead, apiKey) {
  console.log(`[CopywriterAgent] ✍️ Writing persuasive sales copy...`);
  const prompt = `
  You are a world-class Direct Response Copywriter.
  Write high-converting, emotional, and persuasive copy for a 4-page website.
  
  Business: ${lead.businessName}
  Industry: ${lead.industry} (${lead.category})
  Address: ${lead.address}
  Phone: ${lead.phone}
  Operating Hours: ${lead.hours ? lead.hours.join(', ') : 'Standard hours'}
  
  REAL GOOGLE MAPS REVIEWS TO USE AS TESTIMONIALS (Integrate these EXACT quotes into the copy/components):
  ${JSON.stringify(lead.reviews, null, 2)}
  
  Return ONLY valid JSON matching this structure:
  {
    "home": {
      "heroTitle": "...",
      "heroSubtitle": "...",
      "heroCta": "..."
    },
    "about": {
      "headline": "...",
      "story": "...",
      "mission": "..."
    },
    "services": [
      { "title": "...", "description": "..." },
      { "title": "...", "description": "..." },
      { "title": "...", "description": "..." }
    ],
    "contact": {
      "tagline": "..."
    }
  }
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { response_mime_type: "application/json" } })
  });
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

/**
 * Agent 3: The Coder
 */
async function generateWebsiteContent(lead, strategy, copy, images, apiKey) {
  console.log(`[CoderAgent] 🧑‍💻 Assembling multi-page Astro application...`);
  const prompt = `
  You are a Senior React & Astro Engineer.
  Build a fully routed 4-page website.

  STRATEGY:
  - Theme: ${strategy.tailwindPrimaryColor}, Bg: ${strategy.tailwindBgColor}
  - Heading Font: ${strategy.fontFamilyHeading}, Body Font: ${strategy.fontFamilyBody}
  - Components Selected: ${JSON.stringify(strategy.componentSelection)}
  
  IMAGES TO USE (Inject these into components):
  ${JSON.stringify(images, null, 2)}
  
  COPYWRITING TO INJECT:
  ${JSON.stringify(copy, null, 2)}

  INSTRUCTIONS:
  1. Generate 5 files exactly: 
     - src/layouts/Layout.astro (Must include Google Fonts link, import '../styles/global.css'; in the frontmatter, and a sticky <nav>. VERY IMPORTANT: All internal links MUST use \`href={import.meta.env.BASE_URL + "about"}\` etc. to support the subpath router!)
     - src/pages/index.astro (Import and use the Hero and Reviews components. MUST pass the REAL GM Reviews to the Reviews component, mapping \`author_name\` to \`author\`)
     - src/pages/about.astro (A beautiful text-heavy page using the About copy)
     - src/pages/services.astro (Import and use the Services component)
     - src/pages/contact.astro (Import and use the Contact component)
  2. All pages MUST be wrapped in \`<Layout title="...">\`.
  3. Ensure all imported components use curly braces (e.g., \`import { ${strategy.componentSelection.hero} } from '../components/ui/${strategy.componentSelection.hero}.jsx';\`).
  4. Make sure the layout has a dark background and text is legible (e.g., \`bg-zinc-950 text-zinc-100\`). Make it look like a $10k site!

  Output ONLY the files wrapped in XML tags:
  <file path="src/layouts/Layout.astro">...</file>
  <file path="src/pages/index.astro">...</file>
  <file path="src/pages/about.astro">...</file>
  <file path="src/pages/services.astro">...</file>
  <file path="src/pages/contact.astro">...</file>
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  const data = await response.json();
  const rawText = data.candidates[0].content.parts[0].text;
  
  const files = {};
  const regex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    files[match[1]] = match[2].trim();
  }
  
  return files;
}

export async function runSmartBuilderDemo(lead) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`\n[SmartBuilder] 🚀 STARTING POC V2 FOR: ${lead.businessName}...\n`);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

      const deployId = `smart-demo-v2-${Date.now()}`;
      const projectDir = path.join(BUILD_DIR, deployId);
      const baseTemplateDir = path.join(TEMPLATES_DIR, 'astro-base');

      console.log(`[SmartBuilder] 📁 Cloning base template...`);
      await fs.ensureDir(projectDir);
      await fs.copy(baseTemplateDir, projectDir);

      // --- THE PIPELINE ---
      
      // 1. Director
      const strategy = await generateBrandStrategy(lead, apiKey);
      console.log(`[DirectorAgent] ✅ Selected theme: ${strategy.tailwindPrimaryColor} & ${strategy.fontFamilyHeading}`);

      // 2. Copywriter
      const copy = await generateSalesCopy(lead, apiKey);
      console.log(`[CopywriterAgent] ✅ Generated persuasive copy for 4 pages.`);

      // 3. Image Fetcher
      console.log(`[ImageFetcher] 🔍 Hunting for ultra-premium images...`);
      const images = await fetchPremiumImages(strategy.imageKeywords.join(' '), 5);

      // 4. Coder
      const generatedData = await generateWebsiteContent(lead, strategy, copy, images, apiKey);

      // --- FILE INJECTION ---
      console.log(`[SmartBuilder] 📝 Injecting code into Astro routing...`);
      for (const [filePath, content] of Object.entries(generatedData)) {
        const fullPath = path.join(projectDir, filePath);
        await fs.ensureDir(path.dirname(fullPath));
        await fs.writeFile(fullPath, content);
      }

      // --- CONFIG & BUILD ---
      const configPath = path.join(projectDir, 'astro.config.mjs');
      const astroConfig = `// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/demo-preview/${deployId}/dist',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] }
});`;
      await fs.writeFile(configPath, astroConfig);

      console.log(`[SmartBuilder] 📦 Compiling ultra-premium React components (this may take a minute)...`);
      await new Promise((res, rej) => {
        exec('npm install && npm run build', { cwd: projectDir }, (err) => {
          if (err) return rej(err);
          res();
        });
      });

      console.log(`[SmartBuilder] ✅ V2 Build complete!`);
      resolve(`http://localhost:3001/demo-preview/${deployId}/dist`);

    } catch (error) {
      console.error('[SmartBuilder] ❌ Fatal Error:', error);
      reject(error);
    }
  });
}
