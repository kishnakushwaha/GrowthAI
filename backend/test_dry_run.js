import { runAudit } from './engines/auditEngine.js';
import { generateSeoTags } from './engines/seoEngine.js';

async function dryRun() {
  console.log('=== DRY RUN: Phase 4 ===');
  
  // 1. Test auditEngine (Phase 4.1)
  const testUrl = 'https://intercom.com'; 
  console.log(`Auditing ${testUrl} to test tech stack detection...`);
  
  try {
    const result = await runAudit(testUrl);
    console.log(`\n[AuditEngine] Audit completed in ${result.duration}ms.`);
    console.log('[AuditEngine] Extracted Tech Stack:', JSON.stringify(result.techStack));
    
  } catch (err) {
    console.error('[AuditEngine] Failed:', err);
  }

  // 2. Test seoEngine (Phase 4.3)
  console.log(`\nGenerating SEO tags via Gemini...`);
  try {
    // If we don't have GEMINI_API_KEY exported in this shell, it might fail or fallback.
    const seoHtml = await generateSeoTags("GrowthAI Demo", "SaaS", "San Francisco", "AI Automation Platform");
    console.log('[seoEngine] SEO Tags Generated:\n', seoHtml);
  } catch (err) {
    console.error('[seoEngine] Failed:', err);
  }

}

dryRun();
