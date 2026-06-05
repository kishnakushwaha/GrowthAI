import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const BUILD_DIR = path.join(__dirname, '..', '.demo-builds');

async function fetchGeminiWithRetry(url, options, maxRetries = 5) {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    const response = await fetch(url, options);
    if (response.status === 429) {
      const waitTime = Math.pow(2, attempt) * 4000;
      console.warn(`⚠️ [BuilderAgent] Gemini 429 Rate Limited. Attempt ${attempt}/${maxRetries}. Retrying in ${waitTime / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      continue;
    }
    return response;
  }
  return fetch(url, options);
}

/**
 * Uses Gemini API to rewrite Astro code for a specific business.
 */
/**
 * Multi-Agent Pipeline: Step 1 - The Brand Director
 */
async function generateBrandStrategy(lead, reviewsContext, apiKey) {
  console.log(`[DirectorAgent] 🕴️ Analyzing brand identity for ${(lead.place_name || lead.business_name)}...`);
  const prompt = `
  You are an elite Brand Director for a high-end web design agency.
  Analyze the following business and output a strict JSON strategy for the website.
  
  Business: ${(lead.place_name || lead.business_name)}
  Industry: ${lead.industry}
  City: ${lead.city}
  Vibe: ${lead.notes || 'Premium local business'}
  
  Available Components:
  - Heros: HeroWavy, HeroTracingBeam, HeroGlass, HeroSplit, HeroMinimal, HeroGrid, HeroVideo, HeroAbstract, HeroTypography, HeroDarkMatter
  - Reviews: ReviewsMarquee, ReviewsMasonry, ReviewsSlider, ReviewsGlass, ReviewsMinimal, ReviewsCards
  - Services: ServicesBento, ServicesMinimal, ServicesCards, ServicesGlass, ServicesBrutal, ServicesList
  - Contact: ContactSplit, ContactMinimal, ContactGlass, ContactMap, ContactDark, ContactBrutal

  You MUST return ONLY valid JSON matching this exact structure:
  {
    "tailwindPrimaryColor": "emerald-500", // Pick a standard Tailwind color matching the brand vibe (e.g. blue-600, rose-500, amber-400)
    "tailwindBgColor": "stone-950", // Pick a dark mode bg color (e.g. black, slate-950, zinc-900)
    "fontLink": "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap",
    "fontFamilyClass": "font-['Playfair_Display']",
    "imageKeywords": ["luxury spa massage", "zen meditation stones"], // 3 highly specific search terms for photos
    "componentSelection": {
      "hero": "HeroGlass",
      "services": "ServicesBento",
      "reviews": "ReviewsGlass",
      "contact": "ContactMap"
    }
  }
  `;

  const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { response_mime_type: "application/json" }
    })
  });
  if (!response.ok) {
    const errText = await response.text();
    console.error('[DirectorAgent] Gemini API Error:', response.status, errText);
    throw new Error('Failed to generate brand strategy');
  }
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

/**
 * Multi-Agent Pipeline: Step 2 - The Coder
 */
async function generateWebsiteContent(lead, indexCode, aboutCode, layoutCode) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing');

  // 1. Fetch Real Google Maps Reviews
  let realReviews = [];
  try {
    console.log(`[BuilderAgent] 🔍 Fetching real Google Maps reviews for ${(lead.place_name || lead.business_name)}...`);
    const { execSync } = await import('child_process');
    const scraperDir = path.resolve(__dirname, '../../scraper');
    const venvPython = path.join(scraperDir, 'venv/bin/python');
    const fetchScript = path.join(scraperDir, 'fetch_reviews.py');
    
    if (!fs.existsSync(venvPython)) {
      console.warn('[BuilderAgent] ⚠️ Python venv not found at', venvPython, '— using dummy reviews.');
    } else {
      const reviewsOutput = execSync(`"${venvPython}" "${fetchScript}" "${lead.maps_url}"`, { cwd: scraperDir, timeout: 30000 }).toString();
      realReviews = JSON.parse(reviewsOutput);
    }
  } catch (e) {
    console.error(`[BuilderAgent] ⚠️ Failed to fetch real reviews:`, e.message);
  }

  const reviewsContext = realReviews.length > 0 
    ? `Use these REAL Google Maps reviews for the Testimonials component:\n${JSON.stringify(realReviews, null, 2)}`
    : `Generate 3 realistic, highly-positive dummy reviews based on their ${lead.rating} rating.`;

  // 2. Call Brand Director Agent
  const strategy = await generateBrandStrategy(lead, reviewsContext, apiKey);
  console.log(`[DirectorAgent] 🎨 Strategy selected: Primary color ${strategy.tailwindPrimaryColor}, using ${strategy.componentSelection.hero}`);

  // 3. Call Coder Agent
  console.log(`[CoderAgent] 🧑‍💻 Writing code based on Director's blueprint...`);
  const prompt = `
  You are an elite, world-class Web Developer.
  Build a jaw-dropping landing page for this business strictly following the Brand Director's strategy.
  
  Business: ${(lead.place_name || lead.business_name)}
  Industry: ${lead.industry}
  City: ${lead.city}
  Phone: ${lead.phone || 'N/A'}
  
  BRAND STRATEGY TO ENFORCE:
  - Primary Theme Color: text-${strategy.tailwindPrimaryColor}, bg-${strategy.tailwindPrimaryColor}
  - Background Vibe: bg-${strategy.tailwindBgColor}
  - Typography: Include \`<link href="${strategy.fontLink}" rel="stylesheet">\` in the <head> of Layout.astro, and use \`${strategy.fontFamilyClass}\` in the body tag.
  
  COMPONENTS TO IMPORT:
  - Hero: ${strategy.componentSelection.hero}
  - Services: ${strategy.componentSelection.services}
  - Reviews: ${strategy.componentSelection.reviews}
  - Contact: ${strategy.componentSelection.contact}

  REQUIRED PROPS FOR COMPONENTS:
  - Heros: \`title\` (string), \`subtitle\` (string), \`cta\` (string), \`image\` (use: https://source.unsplash.com/1600x900/?${encodeURIComponent(strategy.imageKeywords[0])})
  - Reviews: \`reviews\` (MUST be an array of objects: \`[{ author: "...", text: "...", company: "..." }]\`)
  - Services: \`services\` (MUST be an array of objects: \`[{ title: "...", description: "...", image: "..." }]\`)
  - Contact: \`email\` (string), \`phone\` (string), \`address\` (string)

  INSTRUCTIONS:
  1. Rewrite src/pages/index.astro completely.
     CRITICAL: You MUST wrap the entire page content inside the \`<Layout title="...">\` component and IMPORT it via \`import Layout from '../layouts/Layout.astro';\`. DO NOT output raw <html>, <head>, or <body> tags!
  2. IMPORT the exactly selected components from the UI library into index.astro.
     CRITICAL: You MUST use named imports with curly braces AND the .jsx extension! (e.g. \`import { ${strategy.componentSelection.hero} } from '../components/ui/${strategy.componentSelection.hero}.jsx';\`). DO NOT use default imports.
  3. Rewrite src/layouts/Layout.astro to inject the required Google Fonts link in the <head> and apply the typography and background color classes to the <body> tag.
  
  Do NOT output JSON. Output your files wrapped EXACTLY in XML-like tags like this:
  
  <file path="src/layouts/Layout.astro">
  ---
  import '../styles/global.css';
  ...
  </file>

  <file path="src/pages/index.astro">
  ---
  // astro frontmatter
  ---
  <Layout title="...">...</Layout>
  </file>
  `;

  const response = await fetchGeminiWithRetry(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API Error Body:', errText);
    throw new Error(`Gemini HTTP Error: ${response.status}`);
  }

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

/**
 * The Autonomous Builder Agent core function.
 */
export async function buildAndDeployAgentSite(lead) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`[BuilderAgent] 🚀 Starting autonomous build for ${(lead.place_name || lead.business_name)}...`);
      
      const safeBizName = ((lead.place_name || lead.business_name) || 'demo').replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const deployId = `${safeBizName}-${Date.now()}`;
      const projectDir = path.join(BUILD_DIR, deployId);
      const baseTemplateDir = path.join(TEMPLATES_DIR, 'astro-base');

      if (!fs.existsSync(baseTemplateDir)) {
        throw new Error('astro-base template not found in backend/templates/');
      }

      // 1. Copy Template (excluding node_modules to keep it fast)
      console.log(`[BuilderAgent] 📁 Copying base template to ${projectDir}...`);
      await fs.ensureDir(projectDir);
      await fs.copy(baseTemplateDir, projectDir, {
        filter: (src) => !src.includes('node_modules')
      });

      // Symlink base node_modules if it exists to avoid running npm install
      const baseNodeModules = path.join(baseTemplateDir, 'node_modules');
      const targetNodeModules = path.join(projectDir, 'node_modules');
      if (fs.existsSync(baseNodeModules)) {
        console.log(`[BuilderAgent] 🔗 Symlinking node_modules from base template...`);
        await fs.symlink(baseNodeModules, targetNodeModules, 'dir');
      }

      // 2. Read Original Files
      const indexFilePath = path.join(projectDir, 'src/pages/index.astro');
      const aboutFilePath = path.join(projectDir, 'src/pages/about.astro');
      const layoutFilePath = path.join(projectDir, 'src/layouts/Layout.astro');
      
      const indexCode = await fs.readFile(indexFilePath, 'utf8');
      const aboutCode = await fs.readFile(aboutFilePath, 'utf8');
      const layoutCode = await fs.readFile(layoutFilePath, 'utf8');

      // 3. AI Generation
      const generatedData = await generateWebsiteContent(lead, indexCode, aboutCode, layoutCode);

      // 4. Write New Files
      console.log(`[BuilderAgent] 📝 Overwriting files with AI-generated code...`);
      if (generatedData['src/pages/index.astro']) await fs.writeFile(indexFilePath, generatedData['src/pages/index.astro']);
      if (generatedData['src/pages/about.astro']) await fs.writeFile(aboutFilePath, generatedData['src/pages/about.astro']);
      if (generatedData['src/layouts/Layout.astro']) await fs.writeFile(layoutFilePath, generatedData['src/layouts/Layout.astro']);

      // Add Base path to Astro config
      const configPath = path.join(projectDir, 'astro.config.mjs');
      const astroConfig = `// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  base: '/demo-preview/${deployId}/dist',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()]
  }
});`;
      await fs.writeFile(configPath, astroConfig);

      // 5. Install Dependencies (only if node_modules was not symlinked)
      if (!fs.existsSync(path.join(projectDir, 'node_modules'))) {
        console.log(`[BuilderAgent] 📦 Installing dependencies (fallback)...`);
        await new Promise((res, rej) => {
          exec('npm install', { cwd: projectDir }, (err, stdout, stderr) => {
            if (err) return rej(err);
            res();
          });
        });
      }

      // 5.5 Build the Astro site for local preview
      console.log(`[BuilderAgent] 🏗️ Building Astro site statically...`);
      await new Promise((res, rej) => {
        exec('npm run build', { cwd: projectDir }, (err, stdout, stderr) => {
          if (err) return rej(err);
          res();
        });
      });

      // 6. Deploy to Vercel
      const vercelToken = process.env.VERCEL_TOKEN;
      if (!vercelToken || vercelToken === 'your_vercel_token_here') {
        console.warn('[BuilderAgent] ⚠️ VERCEL_TOKEN missing. Skipping actual Vercel deployment.');
        console.log(`[BuilderAgent] ✅ Local build ready at: ${projectDir}/dist`);
        return resolve(`http://localhost:3001/demo-preview/${deployId}/dist`);
      }

      console.log(`[BuilderAgent] ☁️ Deploying to Vercel...`);
      const deployCmd = `npx vercel --prod --yes --token ${vercelToken}`;
      
      exec(deployCmd, { cwd: projectDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('[BuilderAgent] ❌ Vercel Deploy Error:', stderr);
          console.log(`[BuilderAgent] 🔄 Falling back to local preview URL: http://localhost:3001/demo-preview/${deployId}/dist`);
          return resolve(`http://localhost:3001/demo-preview/${deployId}/dist`);
        }
        const lines = stdout.split('\n');
        const urlLine = lines.find(line => line.startsWith('https://'));
        resolve(urlLine ? urlLine.trim() : `https://${deployId}.vercel.app`);
      });

    } catch (error) {
      console.error('[BuilderAgent] ❌ Fatal Error:', error);
      reject(error);
    }
  });
}
