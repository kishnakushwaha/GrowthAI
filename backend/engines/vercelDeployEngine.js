import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { generateSeoTags } from './seoEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const BUILD_DIR = path.join(__dirname, '..', '.demo-builds');

/**
 * Builds a personalized demo website and deploys it to Vercel.
 * @param {Object} lead - The lead data (business_name, industry, city, phone, email)
 * @param {String} themeName - The template to use (e.g., 'demo1')
 * @returns {Promise<String>} - The live Vercel URL
 */
export async function buildAndDeployDemo(lead, themeName = 'demo1') {
  return new Promise(async (resolve, reject) => {
    try {
      const templatePath = path.join(TEMPLATES_DIR, themeName, 'index.html');
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${themeName} not found.`);
      }

      // 1. Read Template
      let html = fs.readFileSync(templatePath, 'utf8');

      // 2. Generate SEO Tags via AI
      const seoTags = await generateSeoTags(lead.business_name, lead.industry, lead.city, lead.notes);

      // 3. Inject Data
      html = html.replace('<!-- SEO_HEAD_INJECTION -->', seoTags);
      html = html.replace(/{{BUSINESS_NAME}}/g, lead.business_name || 'Your Business');
      html = html.replace(/{{CITY}}/g, lead.city || 'Your City');
      html = html.replace(/{{EMAIL}}/g, lead.email || 'contact@yourbusiness.com');
      html = html.replace(/{{PHONE}}/g, lead.phone || 'Phone number not listed');

      // 4. Create Build Directory
      const safeBizName = (lead.business_name || 'demo').replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const deployId = `${safeBizName}-${Date.now()}`;
      const projectDir = path.join(BUILD_DIR, deployId);
      
      if (!fs.existsSync(BUILD_DIR)) {
        fs.mkdirSync(BUILD_DIR);
      }
      fs.mkdirSync(projectDir);
      
      // Write the compiled HTML
      fs.writeFileSync(path.join(projectDir, 'index.html'), html);

      // 5. Deploy to Vercel
      const vercelToken = process.env.VERCEL_TOKEN;
      if (!vercelToken) {
        console.warn('[Vercel] VERCEL_TOKEN missing. Skipping actual deployment. Returning local path.');
        return resolve(`http://localhost:3001/demo-preview/${deployId}`);
      }

      console.log(`[Vercel] Deploying ${deployId}...`);
      
      // We run `vercel --prod --yes --token ...`
      const deployCmd = `npx vercel --prod --yes --token ${vercelToken}`;
      
      exec(deployCmd, { cwd: projectDir }, (error, stdout, stderr) => {
        if (error) {
          console.error('[Vercel Deploy Error]:', stderr);
          return reject(error);
        }
        
        // Vercel CLI outputs the production URL on stdout
        const lines = stdout.split('\n');
        const urlLine = lines.find(line => line.startsWith('https://'));
        
        if (urlLine) {
          resolve(urlLine.trim());
        } else {
          // Fallback if we can't parse it
          resolve(`https://${deployId}.vercel.app`);
        }
      });

    } catch (error) {
      console.error('Build/Deploy Error:', error);
      reject(error);
    }
  });
}
