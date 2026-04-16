import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import { runAudit } from './engines/auditEngine.js';
import supabase from './supabaseClient.js';
import { configureSmtp, getTransporter, getSmtpEmail, sendEmail, renderTemplate, trackOpen, trackClick, loadSmtpConfig } from './engines/emailEngine.js';
import { STAGES, getLeads, createLead, updateLead, deleteLead, getActivities, addActivity, importFromScraper, getAnalytics } from './engines/crmEngine.js';
import { processSequences } from './engines/waSequenceEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// A11: CORS Allowlist — restrict to frontend + extension origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'https://growthai.kishnaxai.in',
  'https://growthai-backend-814429723132.asia-south1.run.app',
  process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// A1: Extension Token Auth — protects extension-facing endpoints
const EXTENSION_SECRET = process.env.EXTENSION_SECRET || process.env.ADMIN_PASSWORD;
const requireExtAuth = (req, res, next) => {
  const token = req.headers['x-extension-token'];
  if (token && token === EXTENSION_SECRET) return next();
  // Fallback: also accept JWT Bearer tokens (for CRM-triggered calls)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.ADMIN_PASSWORD || 'growthai-secret-key-123');
      if (decoded.role === 'admin') return next();
    } catch (e) {}
  }
  return res.status(401).json({ error: 'Unauthorized: Missing or invalid extension token' });
};

// X5: Structured Logger — outputs JSON for Cloud Logging, human-readable locally
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.K_SERVICE;
const log = {
  info: (msg, meta = {}) => {
    if (IS_PRODUCTION) {
      console.log(JSON.stringify({ severity: 'INFO', message: msg, ...meta, timestamp: new Date().toISOString() }));
    } else {
      console.log(`[INFO] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
  warn: (msg, meta = {}) => {
    if (IS_PRODUCTION) {
      console.warn(JSON.stringify({ severity: 'WARNING', message: msg, ...meta, timestamp: new Date().toISOString() }));
    } else {
      console.warn(`[WARN] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  },
  error: (msg, meta = {}) => {
    if (IS_PRODUCTION) {
      console.error(JSON.stringify({ severity: 'ERROR', message: msg, ...meta, timestamp: new Date().toISOString() }));
    } else {
      console.error(`[ERROR] ${msg}`, Object.keys(meta).length ? meta : '');
    }
  }
};

// X5: Async route wrapper — catches unhandled rejections and returns 500
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    log.error('Unhandled route error', { route: `${req.method} ${req.url}`, error: err.message, stack: err.stack });
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
  });
};

// Global Request Logger
app.use((req, res, next) => {
  log.info(`${req.method} ${req.url}`);
  next();
});

const CONTENT_FILE = path.join(__dirname, 'database', 'content.json');
const SCRAPER_DIR = path.join(__dirname, '..', 'scraper');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD must be set as an environment variable!');
  process.exit(1);
}

// Track active scrape jobs
const activeJobs = {};

// Helper to hash passwords natively
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, hash, salt) {
  const newHash = hashPassword(password, salt);
  return newHash === hash;
}

// ===================== AUTH & SECURITY =====================
const JWT_SECRET = process.env.ADMIN_PASSWORD;

if (!JWT_SECRET) {
  console.warn('⚠️ WARNING: ADMIN_PASSWORD environment variable is not set!');
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many login attempts, please try again after 15 minutes' }
});

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized access: Missing Token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, agencyId, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized access: Invalid or Expired Token' });
  }
};

app.post('/api/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  try {
    // S2 Phase: Authenticate against users table
    const { data: user, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error || !user) {
      // Legacy Fallback (during migration)
      if (email === 'admin@growthai.com' && password === ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin', agencyId: '00000000-0000-0000-0000-000000000001' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, role: 'admin' });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Default salt logic
    let isValid = false;
    if (user.password_hash.includes(':')) {
      const [salt, hash] = user.password_hash.split(':');
      isValid = verifyPassword(password, hash, salt);
    } else {
      // Emergency unhashed check or fallback
      if (password === user.password_hash || (user.password_hash === 'admin_password_fallback' && password === ADMIN_PASSWORD)) {
        isValid = true;
      }
    }

    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ 
      userId: user.id, 
      agencyId: user.agency_id, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// S2: Public Signup API for New Agencies
app.post('/api/signup', authLimiter, async (req, res) => {
  const { agencyName, name, email, password } = req.body;
  if (!agencyName || !name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 1. Check if email is already registered
    const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
    if (existingUser) return res.status(400).json({ error: 'Email already registered' });

    // 2. Create the Agency
    const { data: agency, error: agencyError } = await supabase.from('agencies').insert({
      name: agencyName
    }).select('id').single();
    
    if (agencyError) throw agencyError;

    // 3. Create the Master Admin User for this new agency
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const password_hash = `${salt}:${hash}`;

    const { data: user, error: userError } = await supabase.from('users').insert({
      agency_id: agency.id,
      name,
      email,
      password_hash,
      role: 'admin'
    }).select('id, agency_id, role, name').single();

    if (userError) throw userError;

    // 4. Issue JWT
    const token = jwt.sign({ 
      userId: user.id, 
      agencyId: user.agency_id, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, role: user.role, name: user.name });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create agency account' });
  }
});

// S2: User Management APIs (Agency Level)
app.get('/api/users', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('id, name, email, role, created_at').eq('agency_id', req.user.agencyId);
    if (error) throw error;
    res.json({ users: data || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

app.post('/api/users', requireAuth, async (req, res) => {
  // Only admins can create new team members
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Permission denied' });
  
  const { name, email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  
  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const password_hash = `${salt}:${hash}`;
    
    const { data, error } = await supabase.from('users').insert({
      agency_id: req.user.agencyId,
      name,
      email,
      password_hash,
      role: role || 'member'
    }).select('id, name, email, role');
    
    if (error) throw error;
    res.json({ success: true, user: data[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team member (email may already in use)' });
  }
});

// ===================== S3 GDPR COMPLIANCE API =====================

// Right to Portability (Export all data)
app.get('/api/agency/export', requireAuth, async (req, res) => {
  try {
    const [
      { data: leads },
      { data: campaigns },
      { data: templates }
    ] = await Promise.all([
      supabase.from('businesses').select('*').eq('agency_id', req.user.agencyId),
      supabase.from('campaigns').select('*').eq('agency_id', req.user.agencyId),
      supabase.from('templates').select('*').eq('agency_id', req.user.agencyId)
    ]);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=agency_export.json');
    res.send(JSON.stringify({
      export_date: new Date().toISOString(),
      agency_id: req.user.agencyId,
      user_id: req.user.userId,
      leads: leads || [],
      campaigns: campaigns || [],
      templates: templates || []
    }, null, 2));
  } catch (err) {
    res.status(500).json({ error: 'Data export failed' });
  }
});

// Right to be Forgotten (Soft Delete Workspace)
app.put('/api/agency/archive', requireAuth, async (req, res) => {
  // Only the master admin token should delete the entire workspace
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Only admins can delete the workspace' });

  try {
    // Soft Delete the Agency
    await supabase.from('agencies').update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    }).eq('id', req.user.agencyId);

    // Soft delete all users belonging to the agency so they can't login
    await supabase.from('users').update({ is_deleted: true }).eq('agency_id', req.user.agencyId);

    res.json({ success: true, message: 'Agency workspace successfully archived and locked.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive workspace' });
  }
});

// ===================== S5 BILLING TELEMETRY API =====================

app.get('/api/billing/usage', requireAuth, async (req, res) => {
  try {
    const { data: usageData, error } = await supabase
      .from('usage_events')
      .select('event_type, quantity')
      .eq('agency_id', req.user.agencyId);
      
    if (error) throw error;
    
    // Aggregate by event type
    const metrics = (usageData || []).reduce((acc, curr) => {
      acc[curr.event_type] = (acc[curr.event_type] || 0) + curr.quantity;
      return acc;
    }, { scrape_job: 0, ai_rewrite: 0, email_sent: 0 });

    res.json({ metrics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch usage metrics' });
  }
});

// ===================== CONTENT API =====================
app.get('/api/content', (req, res) => {
  try {
    const data = fs.readFileSync(CONTENT_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read content file' });
  }
});

app.post('/api/content', requireAuth, (req, res) => {
  try {
    const newContent = req.body;
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(newContent, null, 2));
    res.json({ success: true, message: 'Content updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// ===================== LEADS API (Supabase) =====================

// GET /api/leads — Fetch scraped leads with filters
app.get('/api/leads', requireAuth, async (req, res) => {
  try {
    const { industry, min_rating, hot_only, no_website, low_reviews, search, sort_by, sort_dir, page = 1, limit = 50 } = req.query;

    let query = supabase.from('businesses').select('*, website_enrichment(*)', { count: 'exact' }).eq('agency_id', req.user.agencyId);

    if (industry) query = query.ilike('industry', `%${industry}%`);
    if (min_rating) query = query.gte('rating', parseFloat(min_rating));
    if (hot_only === 'true') {
      // Legacy flag + New metric flag
      query = query.or('is_hot_lead.eq.true,lead_score.gte.60');
    }
    if (no_website === 'true') query = query.or("website.is.null,website.eq.,website.eq.N/A");
    if (low_reviews === 'true') query = query.lt('reviews', 15);
    if (search) {
      query = query.or(`place_name.ilike.%${search}%,address.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Sorting
    const allowedSorts = ['place_name', 'rating', 'reviews', 'scraped_at', 'is_hot_lead', 'lead_score'];
    const sortField = allowedSorts.includes(sort_by) ? sort_by : 'scraped_at';
    const ascending = sort_dir === 'asc';
    query = query.order(sortField, { ascending });

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data: leads, count: total, error } = await query;
    if (error) throw error;

    // Stats (from all businesses, unfiltered)
    const { data: allBiz } = await supabase.from('businesses').select('*');
    const all = allBiz || [];
    const stats = {
      total: all.length,
      hot_leads: all.filter(b => b.is_hot_lead || b.lead_score >= 60).length,
      no_website: all.filter(b => !b.website || b.website === 'N/A' || b.website === '').length,
      avg_rating: all.length > 0
        ? (all.filter(b => b.rating).reduce((s, b) => s + (parseFloat(b.rating) || 0), 0) / all.filter(b => b.rating).length).toFixed(1)
        : 0
    };

    // Industries
    const industries = [...new Set(all.map(b => b.industry).filter(Boolean))].sort();

    // F9: Compute enrichment completeness per lead
    const enrichedLeads = (leads || []).map(lead => {
      let filled = 0;
      let total = 8;
      if (lead.phone && lead.phone !== 'N/A') filled++;
      if (lead.website && lead.website !== 'N/A' && lead.website !== '') filled++;
      if (lead.rating && lead.rating !== 'N/A') filled++;
      if (lead.reviews && lead.reviews > 0) filled++;
      if (lead.address && lead.address !== 'N/A') filled++;
      if (lead.industry && lead.industry !== '') filled++;
      if (lead.website_enrichment && lead.website_enrichment.length > 0) filled++;
      if (lead.website_enrichment?.[0]?.extracted_email) filled++;
      return { ...lead, enrichment_pct: Math.round((filled / total) * 100) };
    });

    res.json({ leads: enrichedLeads, total: total || 0, stats, industries });
  } catch (error) {
    console.error('Leads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/signals - Dedicated SEO and Tech Analytics Dashboard Data
app.get('/api/signals', requireAuth, async (req, res) => {
  try {
    const { data: signals, error } = await supabase
      .from('website_enrichment')
      .select('*, businesses:businesses!inner(id, place_name, website, industry, search_city)')
      .eq('agency_id', req.user.agencyId)
      .order('scraped_at', { ascending: false });

    if (error) throw error;
    res.json({ signals: signals || [] });
  } catch (error) {
    console.error('Signals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch SEO signals' });
  }
});
// GET /api/leads/export — Export CSV
app.get('/api/leads/export', requireAuth, async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('agency_id', req.user.agencyId)
      .order('scraped_at', { ascending: false });

    if (error) throw error;

    const headers = ['Name', 'Industry', 'Rating', 'Reviews', 'Phone', 'Website', 'Address', 'Maps URL', 'Hot Lead', 'Scraped At'];
    const rows = (leads || []).map(l => [
      `"${(l.place_name || '').replace(/"/g, '""')}"`,
      `"${(l.industry || '').replace(/"/g, '""')}"`,
      l.rating,
      l.reviews,
      `"${l.phone || ''}"`,
      `"${l.website || ''}"`,
      `"${(l.address || '').replace(/"/g, '""')}"`,
      `"${l.maps_url || ''}"`,
      l.is_hot_lead ? 'Yes' : 'No',
      l.scraped_at
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export' });
  }
});

// ===================== TEMPLATES (Phase 6.7) =====================
app.get('/api/templates', requireAuth, async (req, res) => {
  try {
    const { data: templates, error } = await supabase.from('templates').select('*').eq('agency_id', req.user.agencyId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ templates: templates || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

app.post('/api/templates', requireAuth, async (req, res) => {
  try {
    const { name, channel, opportunity_type, body } = req.body;
    const { data, error } = await supabase.from('templates').insert([{ 
      name, channel, opportunity_type, body, agency_id: req.user.agencyId 
    }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

app.put('/api/templates/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, channel, opportunity_type, body } = req.body;
    const { data, error } = await supabase.from('templates').update({ name, channel, opportunity_type, body, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

app.delete('/api/templates/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('templates').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// ===================== WA MAGIC REWRITE (Phase 8.3) =====================
app.post('/api/wa/ai-rewrite', requireAuth, async (req, res) => {
  try {
    const { base_template, lead_id, contact_name, business_name, city } = req.body;
    
    // Fetch deeper loop holes
    let context_string = "No specific data found.";
    if (lead_id) {
       const { data: lead_data } = await supabase.from('website_enrichment').select('*').eq('business_id', lead_id).single();
       if (lead_data) {
          const defects = [];
          if (lead_data.seo_score >= 5) defects.push(`Heavy SEO penalty of ${lead_data.seo_score}/10.`);
          if (lead_data.pagespeed_mobile && lead_data.pagespeed_mobile < 60) defects.push(`Slow mobile speed (${lead_data.pagespeed_mobile}/100).`);
          if (!lead_data.has_fb_pixel) defects.push(`Missing Meta/FB Pixel.`);
          if (!lead_data.has_google_ads) defects.push(`Missing Google Ads tracking.`);
          if (lead_data.ai_human_summary) defects.push(`Their website details: ${lead_data.ai_human_summary}`);
          
          context_string = defects.join(' ');
       }
    }

    const prompt = `You are a casual, highly-effective sales closer sending a 1-to-1 WhatsApp message. 
Take the following Template Draft and rewrite it so it sounds like a real human quickly typed it out on their phone to ${contact_name || 'the owner'} at ${business_name}. 
Do not use corporate jargon. Avoid "Dear Sir/Madam". Be brief, punchy, and conversational.
Critical Context about their business you MUST weave into the message naturally (do not list them, just mention one or two as the reason you are reaching out):
${context_string}
    
Template Draft:
${base_template}

Output only the raw rewritten WhatsApp message.`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const geminiData = await geminiRes.json();
    console.log('[Gemini Response Raw]:', JSON.stringify(geminiData));

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
        const errorMsg = geminiData.error?.message || "NLP extraction failed (Empty Candidate List).";
        return res.status(500).json({ error: errorMsg });
    }
    
    // Fix: Gemini sometimes wraps results in markdown blocks if the prompt isn't strict enough
    const rawText = geminiData.candidates[0].content.parts[0].text || "";
    const rewritten = rawText.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();

    // Log AI token usage (S5)
    if (req.user && req.user.agencyId) {
       await supabase.from('usage_events').insert({
         agency_id: req.user.agencyId,
         event_type: 'ai_rewrite',
         quantity: 1
       });
    }

    res.json({ success: true, rewritten_body: rewritten });
  } catch(e) {
    console.error('AI Rewrite Critical Error:', e);
    res.status(500).json({ error: 'Internal NLP error: ' + e.message });
  }
});

// ===================== QUEUE WORKER =====================
setInterval(async () => {
  try {
    const { data } = await supabase.from('scrape_jobs').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(1);
    if (!data || data.length === 0) return;

    const job = data[0];
    const jobId = job.id.toString();

    // Mark as running
    await supabase.from('scrape_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', job.id);

    activeJobs[jobId] = {
      status: 'running',
      query: job.query,
      count: job.target_count,
      output: [],
      startedAt: new Date().toISOString()
    };

    let pythonPath = path.join(SCRAPER_DIR, 'venv', 'bin', 'python');
    if (process.env.NODE_ENV === 'production' || !fs.existsSync(pythonPath)) {
      pythonPath = 'python3';
    }

    const scraperScript = path.join(SCRAPER_DIR, 'main.py');
    const proc = spawn(pythonPath, [
      scraperScript, 
      job.query, 
      job.target_count.toString(), 
      job.agency_id || "00000000-0000-0000-0000-000000000001"
    ], {
      cwd: SCRAPER_DIR,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      activeJobs[jobId].output.push(...lines);
      console.log(`[Scraper ${jobId}]`, data.toString().trim());
    });

    proc.stderr.on('data', (data) => {
      activeJobs[jobId].output.push(`ERROR: ${data.toString().trim()}`);
      console.error(`[Scraper ${jobId} ERR]`, data.toString().trim());
    });

    proc.on('close', async (code) => {
      const status = code === 0 ? 'completed' : 'failed';
      activeJobs[jobId].status = status;
      activeJobs[jobId].completedAt = new Date().toISOString();
      await supabase.from('scrape_jobs').update({ 
        status, 
        completed_at: new Date().toISOString(),
        error_log: code !== 0 ? activeJobs[jobId].output.join('\n') : null
      }).eq('id', job.id);
    });

  } catch (err) {
    console.error('Queue worker error:', err);
  }
}, 5000);

// POST /api/scrape — Trigger a new scrape
app.post('/api/scrape', requireAuth, async (req, res) => {
  const { query, count = 10 } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // A8: Concurrency cap — only 1 scrape job at a time
    const { data: running } = await supabase
      .from('scrape_jobs')
      .select('id')
      .eq('status', 'running')
      .limit(1);
    
    if (running && running.length > 0) {
      return res.status(429).json({ 
        error: 'A scrape is already running. Wait for it to finish.',
        activeJobId: running[0].id.toString()
      });
    }

    const { data, error } = await supabase.from('scrape_jobs').insert({
      query,
      target_count: count,
      agency_id: req.user?.agencyId || "00000000-0000-0000-0000-000000000001"
    }).select('id').single();

    if (error) throw error;

    res.json({ jobId: data.id.toString(), message: `Scrape queued for "${query}" (${count} leads)` });
  } catch (err) {
    console.error('Failed to queue job', err);
    res.status(500).json({ error: 'Failed to queue job' });
  }
});

// POST /api/scrape/reset — Force reset any jammed scrape jobs
app.post('/api/scrape/reset', requireAuth, async (req, res) => {
  try {
    // Clear both running AND pending jobs to ensure a complete clean slate
    await supabase.from('scrape_jobs').update({ status: 'failed', error_log: 'Manually reset by user' }).in('status', ['running', 'pending']);
    
    // Also clear in-memory activeJobs
    Object.keys(activeJobs).forEach(key => delete activeJobs[key]);
    res.json({ success: true, message: 'Scraper system reset. All running and pending jobs cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'System reset failed' });
  }
});

// GET /api/scrape/:jobId — Check scrape job status
app.get('/api/scrape/:jobId', requireAuth, async (req, res) => {
  const jobId = req.params.jobId;
  const activeJob = activeJobs[jobId];
  
  if (activeJob) {
    return res.json(activeJob);
  }

  // Not in memory, check DB (might be completed or pending)
  try {
    const { data } = await supabase.from('scrape_jobs').select('*').eq('id', jobId).single();
    if (data) {
      return res.json({
        status: data.status,
        query: data.query,
        count: data.target_count,
        output: data.error_log ? ["Job Finished.", data.error_log] : ["Job Finished."],
        startedAt: data.created_at,
        completedAt: data.completed_at
      });
    }
  } catch (err) {}

  res.status(404).json({ error: 'Job not found' });
});

// ===================== EXTENSION API =====================

app.get('/api/extension/pending-tasks', requireExtAuth, async (req, res) => {
  try {
    // 1. Check Legacy Outreach Log (Single sends)
    const { data: legacy, error: err1 } = await supabase
      .from('outreach_log')
      .select('id, channel, template_used, businesses!inner(phone, place_name)')
      .eq('status', 'enqueued')
      .limit(5);
    
    // 2. Check New Phase 8 Sequence Queue
    const { data: sequences, error: err2 } = await supabase
      .from('pending_outreach')
      .select('id, lead_id, channel, message_body, businesses!inner(phone, place_name)')
      .eq('status', 'pending')
      .limit(5);

    if (err1 || err2) throw err1 || err2;

    // Combine and format for Extension
    const combined = [
      ...(legacy || []).map(l => ({
         id: l.id,
         phone: l.businesses.phone,
         message: l.template_used,
         biz_name: l.businesses.place_name,
         type: 'legacy'
      })),
      ...(sequences || []).map(s => ({
         id: s.id,
         phone: s.businesses.phone,
         message: s.message_body,
         biz_name: s.businesses.place_name,
         type: 'sequence'
      }))
    ];

    res.json(combined);
  } catch (err) {
    console.error('Queue fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update status from extension for both types
app.post('/api/extension/update-status', requireExtAuth, async (req, res) => {
  const { id, type, status } = req.body;
  try {
    if (type === 'sequence') {
       await supabase.from('pending_outreach').update({ status }).eq('id', id);
    } else {
       await supabase.from('outreach_log').update({ status }).eq('id', id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

app.post('/api/extension/log-reply', requireExtAuth, async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  
  try {
    // 1. Find the lead by phone
    const { data: leadData } = await supabase.from('businesses').select('id, place_name').eq('phone', phone).limit(1).single();
    if (!leadData) return res.status(404).json({ error: 'Lead not found' });

    console.log(`[REPLY-IQ] Detected reply from ${leadData.place_name} (${phone}). Updating CRM...`);

    // 2. Mark as replied in outreach logs
    await supabase.from('outreach_log')
      .update({ status: 'replied', reply_detected_at: new Date().toISOString() })
      .eq('lead_id', leadData.id)
      .neq('status', 'replied');

    // 3. AUTO-PAUSE active automated sequences
    const { error: seqError } = await supabase.from('campaign_leads')
      .update({ status: 'replied' })
      .eq('lead_id', leadData.id)
      .eq('status', 'active');
    
    if (seqError) console.error('[REPLY-IQ] Failed to pause sequences:', seqError.message);

    // 4. MOVE in Sales Pipeline (CRM)
    const { error: crmError } = await supabase.from('pipeline_leads')
      .update({ stage: 'contacted', updated_at: new Date().toISOString() })
      .eq('phone', phone);
    
    if (crmError) console.error('[REPLY-IQ] CRM stage update failed:', crmError.message);

    // 5. Add Activity Log
    await supabase.from('activities').insert({
      lead_id: leadData.id,
      type: 'replied',
      title: 'WhatsApp Reply Detected',
      description: `Lead replied on WhatsApp. Automated sequences paused and moved to "Contacted" stage.`
    });

    res.json({ success: true, message: 'CRM updated and sequences paused.' });
  } catch (err) {
    console.error('Log reply error:', err);
    res.status(500).json({ error: 'Failed to log reply Intelligence' });
  }
});

app.post('/api/extension/update-status', requireExtAuth, async (req, res) => {
  const { log_id, status } = req.body;
  try {
    const { error } = await supabase.from('outreach_log').update({ status }).eq('id', log_id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// ===================== AUDIT API (Supabase) =====================

// POST /api/audit — Run a website audit (public — no auth needed)
// R5: Now auto-captures leads into CRM pipeline
app.post('/api/audit', async (req, res) => {
  const { url, business_name, contact_name, contact_email, contact_phone } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Website URL is required' });
  }

  try {
    const result = await runAudit(url);

    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Save to Supabase
    const { data: auditRow, error } = await supabase.from('audits').insert({
      url: result.url,
      business_name: business_name || '',
      contact_name: contact_name || '',
      contact_email: contact_email || '',
      contact_phone: contact_phone || '',
      overall_score: result.overallScore,
      grade: result.grade,
      critical_issues: result.summary.critical,
      warnings: result.summary.warnings,
      passed: result.summary.passed,
      page_speed_performance: result.pageSpeed?.performance || null,
      page_speed_seo: result.pageSpeed?.seo || null,
      full_report: result,
      status: 'completed'
    }).select('id').single();

    if (error) throw error;

    // R5: Auto-capture lead into CRM pipeline
    if (contact_name && contact_phone) {
      try {
        // Check if lead already exists by phone
        const { data: existing } = await supabase
          .from('pipeline_leads')
          .select('id')
          .eq('phone', contact_phone)
          .limit(1);
        
        if (!existing || existing.length === 0) {
          const { data: newLead } = await supabase.from('pipeline_leads').insert({
            business_name: business_name || url,
            contact_name,
            email: contact_email || '',
            phone: contact_phone,
            website: url,
            source: 'audit_tool',
            stage: 'new',
            priority: result.overallScore < 50 ? 'high' : 'medium',
            notes: `Audit Score: ${result.overallScore}/100 (Grade: ${result.grade}) | ${result.summary.critical} critical issues`
          }).select('id').single();

          if (newLead) {
            await supabase.from('activities').insert({
              lead_id: newLead.id,
              type: 'created',
              title: 'Lead captured from Website Audit',
              description: `Scored ${result.overallScore}/100. ${result.summary.critical} critical, ${result.summary.warnings} warnings.`
            });
            log.info('R5: Lead auto-captured from audit', { phone: contact_phone, score: result.overallScore });
          }
        }
      } catch (leadErr) {
        log.warn('R5: Failed to auto-capture audit lead', { error: leadErr.message });
      }
    }

    res.json({ ...result, auditId: auditRow.id });
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'Audit failed: ' + error.message });
  }
});

// GET /api/audits — List all audit submissions (admin)
app.get('/api/audits', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('audits')
      .select('id, url, business_name, contact_name, contact_email, contact_phone, overall_score, grade, critical_issues, warnings, passed, page_speed_performance, page_speed_seo, status, created_at', { count: 'exact' });

    if (search) {
      query = query.or(`url.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%,business_name.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + parseInt(limit) - 1);

    const { data: audits, count: total, error } = await query;
    if (error) throw error;

    // Stats
    const { data: allAudits } = await supabase.from('audits').select('overall_score, contact_email');
    const all = allAudits || [];
    const stats = {
      total: all.length,
      avg_score: all.length > 0 ? Math.round(all.reduce((s, a) => s + (a.overall_score || 0), 0) / all.length) : 0,
      poor_sites: all.filter(a => (a.overall_score || 0) < 40).length,
      with_email: all.filter(a => a.contact_email && a.contact_email.trim() !== '').length
    };

    res.json({ audits: audits || [], total: total || 0, stats });
  } catch (error) {
    console.error('Audits list error:', error);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

// GET /api/audits/:id — Get full audit report
app.get('/api/audits/:id', async (req, res) => {
  try {
    const { data: audit, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !audit) return res.status(404).json({ error: 'Audit not found' });
    
    // full_report is already JSONB in Supabase, no need to parse
    res.json(audit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit' });
  }
});

// ===================== EMAIL / OUTREACH API (Supabase) =====================

// POST /api/email/configure — Set SMTP credentials
// GET /api/email/status — Check if SMTP is configured
app.get('/api/email/status', requireAuth, async (req, res) => {
  try {
    // If transporter isn't initialized yet, try loading it from DB
    if (!getTransporter()) {
      await loadSmtpConfig();
    }
    
    res.json({ 
      configured: !!getTransporter(), 
      email: getSmtpEmail() || null 
    });
  } catch (err) {
    res.json({ configured: false, email: null });
  }
});

// GET /api/email/templates — List templates
app.get('/api/email/templates', requireAuth, async (req, res) => {
  try {
    const { data: templates, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) throw error;
    res.json({ templates: templates || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// POST /api/email/configure — Save SMTP settings
app.post('/api/email/configure', requireAuth, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    // Basic validation / verification before saving
    await configureSmtp({ email, password });
    res.json({ success: true, email });
  } catch (err) {
    let errorMsg = err.message;
    if (err.message.includes('Invalid login') || err.message.includes('auth')) {
      errorMsg = 'Invalid credentials. Make sure you are using a Gmail App Password.';
    }
    res.status(500).json({ error: 'Failed to configure SMTP: ' + errorMsg });
  }
});

// POST /api/email/templates — Create template
app.post('/api/email/templates', requireAuth, async (req, res) => {
  const { name, subject, body } = req.body;
  if (!name || !subject || !body) {
    return res.status(400).json({ error: 'Name, subject, and body are required' });
  }
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({ name, subject, body })
      .select('id')
      .single();
    
    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PUT /api/email/templates/:id — Update template
app.put('/api/email/templates/:id', requireAuth, async (req, res) => {
  const { name, subject, body } = req.body;
  try {
    const { error } = await supabase
      .from('email_templates')
      .update({ name, subject, body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// POST /api/wa/send — Manual WhatsApp from Dashboard
app.post('/api/wa/send', requireAuth, async (req, res) => {
  const { phone, message, leadId, bizName } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'Phone and message required' });

  try {
    const trackingId = uuidv4();
    const trackingBaseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

    // Helper to wrap manual links
    const wrapUrls = (text, tId, base) => {
      const urlRegex = /(https?:\/\/[^\s<]+)/g;
      return text.replace(urlRegex, (url) => {
        if (url.includes('/api/track/click/')) return url;
        return `${base}/api/track/click/${tId}?url=${encodeURIComponent(url)}`;
      });
    };

    const trackedMessage = wrapUrls(message, trackingId, trackingBaseUrl);

    const response = await fetch('http://localhost:4000/api/wa/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message: trackedMessage })
    });

    const data = await response.json();
    
    if (data.success) {
      // Log manual send log with engagement tracking — FAIL-SAFE VERSION
      const logData = {
        lead_id: leadId || null,
        tracking_id: trackingId,
        phone,
        biz_name: bizName || 'Manual',
        message: trackedMessage,
        type: 'manual',
        status: 'sent'
      };

      const { error: insertErr } = await supabase.from('wa_logs').insert(logData);
      
      if (insertErr) {
        console.error('[WA-API] Tracking Log Insert Failed, attempting fallback...', insertErr.message);
        delete logData.tracking_id;
        await supabase.from('wa_logs').insert(logData);
      }
      
      res.json({ success: true, trackingId });
    } else {
      res.status(500).json({ error: data.error || 'Automation Engine (Port 4000) Failed' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Manual send failed: ' + err.message });
  }
});

// POST /api/email/send — Send a single email
app.post('/api/email/send', requireAuth, async (req, res) => {
  const { to, toName, businessName, templateId, variables } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email required' });

  try {
    let subject, body;

    if (templateId) {
      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();
      
      if (error || !template) return res.status(404).json({ error: 'Template not found' });
      subject = renderTemplate(template.subject, variables || {});
      body = renderTemplate(template.body, variables || {});
    } else {
      subject = req.body.subject;
      body = req.body.body;
    }

    if (!subject || !body) return res.status(400).json({ error: 'Subject and body required' });

    const result = await sendEmail({
      to, toName, businessName, subject, body,
      trackingBaseUrl: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Send failed: ' + err.message });
  }
});

// POST /api/campaigns — Create a campaign
app.post('/api/campaigns', requireAuth, async (req, res) => {
  const { name, templateId, recipients } = req.body;
  if (!name || !templateId) return res.status(400).json({ error: 'Name and template required' });

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ name, template_id: templateId, total_recipients: (recipients || []).length })
      .select('id')
      .single();

    if (error) throw error;
    res.json({ success: true, campaignId: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// GET /api/campaigns — List campaigns
app.get('/api/campaigns', requireAuth, async (req, res) => {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*, email_templates(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten template name
    const formattedCampaigns = (campaigns || []).map(c => ({
      ...c,
      template_name: c.email_templates?.name || '',
    }));

    // Stats
    const stats = {
      total_campaigns: formattedCampaigns.length,
      total_sent: formattedCampaigns.reduce((s, c) => s + (c.sent_count || 0), 0),
      total_opened: formattedCampaigns.reduce((s, c) => s + (c.opened_count || 0), 0),
      total_clicked: formattedCampaigns.reduce((s, c) => s + (c.clicked_count || 0), 0),
    };

    res.json({ campaigns: formattedCampaigns, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /api/campaigns/:id/send — Execute campaign
app.post('/api/campaigns/:id/send', requireAuth, async (req, res) => {
  const { recipients, variables } = req.body;
  if (!recipients || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients list required' });
  }

  try {
    // Get campaign + template
    const { data: campaign, error: campError } = await supabase
      .from('campaigns')
      .select('*, email_templates(subject, body)')
      .eq('id', req.params.id)
      .single();

    if (campError || !campaign) return res.status(404).json({ error: 'Campaign not found' });

    const templateSubject = campaign.email_templates?.subject;
    const templateBody = campaign.email_templates?.body;

    await supabase.from('campaigns')
      .update({ status: 'sending', total_recipients: recipients.length, sent_at: new Date().toISOString() })
      .eq('id', req.params.id);

    let sentCount = 0;
    let failCount = 0;
    const results = [];

    for (const r of recipients) {
      const mergedVars = { ...variables, ...r.vars };
      const subject = renderTemplate(templateSubject, mergedVars);
      const body = renderTemplate(templateBody, mergedVars);

      try {
        const result = await sendEmail({
          to: r.email,
          toName: r.name,
          businessName: r.businessName,
          subject, body,
          campaignId: parseInt(req.params.id),
          trackingBaseUrl: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
        });
        sentCount++;
        results.push({ email: r.email, status: 'sent', trackingId: result.trackingId });
      } catch (err) {
        failCount++;
        results.push({ email: r.email, status: 'failed', error: err.message });
      }

      // 2s delay between emails
      if (recipients.indexOf(r) < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    await supabase.from('campaigns')
      .update({ status: 'completed' })
      .eq('id', req.params.id);

    res.json({ success: true, sent: sentCount, failed: failCount, results });
  } catch (err) {
    res.status(500).json({ error: 'Campaign send failed: ' + err.message });
  }
});

// GET /api/email/logs — Email activity log
app.get('/api/email/logs', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data: logs, count: total, error } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    const { data: allLogs } = await supabase.from('email_logs').select('status, opened_at, clicked_at');
    const all = allLogs || [];
    const stats = {
      total_sent: all.length,
      total_opened: all.filter(l => l.opened_at).length,
      total_clicked: all.filter(l => l.clicked_at).length,
      total_failed: all.filter(l => l.status === 'failed').length
    };

    res.json({ logs: logs || [], total: total || 0, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ===================// GET /api/sequences/campaigns - List active campaigns
app.get('/api/sequences/campaigns', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('campaigns').select('*').eq('agency_id', req.user.agencyId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// DELETE /api/sequences/campaigns/:id
app.delete('/api/sequences/campaigns/:id', requireAuth, async (req, res) => {
  try {
    const { error } = await supabase.from('campaigns').delete().eq('id', req.params.id);
    if (error) {
      console.error('Sequence delete error:', error);
      return res.status(500).json({ error: error.message || 'Failed to delete sequence' });
    }
    res.json({ success: true, message: 'Sequence deleted' });
  } catch (err) {
    res.status(500).json({ error: 'System error during deletion' });
  }
});

// POST /api/intelligence/enrich/:id
app.post('/api/intelligence/enrich/:id', requireAuth, async (req, res) => {
  const { id } = req.params; // This will be treated as the business_id (lead_id)
  try {
    // 1. Try to fetch existing or upsert a blank one if missing
    // We search by lead_id (business_id) because that's the common reference
    const { data: lead } = await supabase.from('businesses').select('id, place_name, website, search_city, industry').eq('id', id).single();
    if (!lead) return res.status(404).json({ error: 'Business not found' });

    let { data: enrichment, error: fetchErr } = await supabase
      .from('website_enrichment')
      .select('*')
      .eq('lead_id', id)
      .maybeSingle();

    if (!enrichment) {
      // Create a blank row if it doesn't exist yet
      const { data: newRow, error: createErr } = await supabase.from('website_enrichment').insert({ lead_id: id, agency_id: req.user.agencyId }).select().single();
      if (createErr) throw createErr;
      enrichment = newRow;
    }

    // 2. Prepare enrichment prompt
    const prompt = `Analyze this business details and provide a professional, one-sentence "human summary" of their likely pain points or digital presence, and a conversational "first-line icebreaker" I can use in an email/whatsapp.
    
    Business: ${lead.place_name}
    City: ${lead.search_city}
    Industry: ${lead.industry}
    Website: ${lead.website}
    CMS: ${enrichment.cms_stack || 'Unknown'}
    Pixels: ${enrichment.has_fb_pixel ? 'Yes' : 'No'}
    
    Return ONLY a JSON object with: "ai_human_summary" (string) and "ai_first_line" (string).`;

    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Robust cleaning for common LLM markdown formatting
    let aiData = { ai_human_summary: "N/A", ai_first_line: "Hi there!" };
    try {
      const cleanedJson = rawText.replace(/```[a-z]*\n/g, '').replace(/```/g, '').trim();
      aiData = { ...aiData, ...JSON.parse(cleanedJson) };
    } catch (parseErr) {
      log.warn('AI JSON Parse failed, using fallback regex', { rawText });
      const summaryMatch = rawText.match(/"ai_human_summary":\s*"([^"]+)"/);
      const firstLineMatch = rawText.match(/"ai_first_line":\s*"([^"]+)"/);
      if (summaryMatch) aiData.ai_human_summary = summaryMatch[1];
      if (firstLineMatch) aiData.ai_first_line = firstLineMatch[1];
    }

    const { data: updated, error: upErr } = await supabase
      .from('website_enrichment')
      .update({ 
        ai_human_summary: aiData.ai_human_summary || "N/A", 
        ai_first_line: aiData.ai_first_line || "Hi there!"
      })
      .eq('lead_id', id)
      .select('*, businesses:businesses!inner(place_name, website, industry, search_city)')
      .single();

    if (upErr) {
      log.error('Database update failed after AI enrichment', { error: upErr.message });
      throw upErr;
    }
    res.json({ success: true, updated });
  } catch (err) {
    console.error('Enrichment failed:', err);
    res.status(500).json({ error: 'AI Enrichment failed' });
  }
});

// POST /api/sequences/campaigns - Create a new sequence// POST /api/sequences/campaigns - Create a new sequence
app.post('/api/sequences/campaigns', requireAuth, async (req, res) => {
  try {
    const { name, industry, description } = req.body;
    const { data, error } = await supabase.from('campaigns').insert([{ name, industry, description, status: 'active' }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create campaign: ' + (err.message || err.error_description) });
  }
});

// GET /api/sequences/campaigns/:id/steps - Get steps for a campaign
app.get('/api/sequences/campaigns/:id/steps', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('sequence_steps').select('*').eq('campaign_id', req.params.id).order('day_offset', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch steps' });
  }
});

// POST /api/sequences/campaigns/:id/steps - Add/Update a step
app.post('/api/sequences/campaigns/:id/steps', requireAuth, async (req, res) => {
  try {
    const { day_offset, channel, template_body } = req.body;
    const { data, error } = await supabase.from('sequence_steps').insert([{ 
      campaign_id: req.params.id, 
      day_offset, 
      channel, 
      template_body 
    }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add step: ' + (err.message || err.error_description) });
  }
});

// POST /api/sequences/enroll - Enroll lead in campaign
app.post('/api/sequences/enroll', requireAuth, async (req, res) => {
  try {
    const { campaign_id, lead_id } = req.body;
    
    // 1. Fetch lead from the CRM pipeline
    const { data: pipelineLead } = await supabase.from('pipeline_leads').select('*').eq('id', lead_id).single();
    if (!pipelineLead) return res.status(404).json({ error: 'Lead not found in CRM' });

    // 2. Force Sync into `businesses` table to satisfy Foreign Key constraints for the AI engine
    await supabase.from('businesses').upsert({
      id: lead_id,
      place_name: pipelineLead.business_name || 'Business',
      phone: pipelineLead.phone || null,
      website: pipelineLead.website || null
    }, { onConflict: 'id' });
    
    // Check if already enrolled
    const { data: existing } = await supabase.from('campaign_leads').select('id').eq('campaign_id', campaign_id).eq('lead_id', lead_id).single();
    if (existing) return res.status(400).json({ error: 'Lead already enrolled in this campaign' });

    // F7: A/B variant assignment — alternate per enrollment
    const { count: enrollCount } = await supabase.from('campaign_leads').select('id', { count: 'exact', head: true }).eq('campaign_id', campaign_id);
    const variant = (enrollCount || 0) % 2 === 0 ? 'A' : 'B';

    const { data, error } = await supabase.from('campaign_leads').insert([{ 
      campaign_id, 
      lead_id, 
      status: 'active', 
      current_step: 0,
      variant
    }]).select().single();
    
    if (error) throw error;

    // Immediately trigger scheduler check
    processSequences();

    res.json({ success: true, enrollment: data });
  } catch (err) {
    console.error('Enrollment error:', err);
    res.status(500).json({ error: 'Failed to enroll lead' });
  }
});

// POST /api/sequences/run - Manual trigger for Scheduler
app.post('/api/sequences/run', requireAuth, async (req, res) => {
  try {
      await processSequences();
      res.json({ success: true, message: 'Sequence engine processed.' });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// GET /api/sequences/queue - Get upcoming outreach
app.get('/api/sequences/queue', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pending_outreach')
      .select('*, businesses(place_name, phone), campaigns(name)')
      .order('scheduled_for', { ascending: true })
      .limit(50);
    
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// GET /api/wa/pending - Pick up tasks for Chrome Extension
app.get('/api/wa/pending', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('pending_outreach')
      .select('*, businesses(place_name, phone)')
      .eq('status', 'pending')
      .eq('channel', 'whatsapp')
      .limit(10);
      
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending outreach' });
  }
});

// F3: GET /api/sequences/performance — Outreach performance dashboard data
app.get('/api/sequences/performance', requireAuth, async (req, res) => {
  try {
    // 1. Outreach stats by status
    const { data: allOutreach } = await supabase.from('pending_outreach').select('status, channel, created_at, campaign_id');
    const outreach = allOutreach || [];
    
    const totalSent = outreach.filter(o => o.status === 'sent').length;
    const totalPending = outreach.filter(o => o.status === 'pending').length;
    const totalFailed = outreach.filter(o => o.status === 'failed').length;

    // 2. Campaign enrollment stats
    const { data: enrollments } = await supabase.from('campaign_leads').select('status, campaign_id, current_step');
    const enroll = enrollments || [];
    const activeEnrollments = enroll.filter(e => e.status === 'active').length;
    const repliedEnrollments = enroll.filter(e => e.status === 'replied').length;
    const completedEnrollments = enroll.filter(e => e.status === 'completed').length;
    const replyRate = enroll.length > 0 ? ((repliedEnrollments / enroll.length) * 100).toFixed(1) : 0;

    // 3. Daily send volume (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentSends = outreach.filter(o => o.status === 'sent' && o.created_at >= sevenDaysAgo);
    const dailyVolume = {};
    recentSends.forEach(o => {
      const day = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      dailyVolume[day] = (dailyVolume[day] || 0) + 1;
    });

    // 4. Campaign breakdown
    const { data: campaigns } = await supabase.from('campaigns').select('id, name');
    const campaignMap = {};
    (campaigns || []).forEach(c => { campaignMap[c.id] = c.name; });
    
    const campaignStats = {};
    enroll.forEach(e => {
      const name = campaignMap[e.campaign_id] || 'Unknown';
      if (!campaignStats[name]) campaignStats[name] = { active: 0, replied: 0, completed: 0, total: 0 };
      campaignStats[name].total++;
      campaignStats[name][e.status] = (campaignStats[name][e.status] || 0) + 1;
    });

    // 5. Rewrite failures (AI health)
    const { data: failures } = await supabase.from('rewrite_failures').select('reason, created_at').order('created_at', { ascending: false }).limit(10);

    // Log AI token usage (S5)
    if (req.user && req.user.agencyId) {
       await supabase.from('usage_events').insert({
         agency_id: req.user.agencyId,
         event_type: 'ai_rewrite',
         quantity: 1
       });
    }

    res.json({
      overview: {
        total_sent: totalSent,
        total_pending: totalPending,
        total_failed: totalFailed,
        active_sequences: activeEnrollments,
        replied: repliedEnrollments,
        completed: completedEnrollments,
        reply_rate: parseFloat(replyRate)
      },
      dailyVolume: Object.entries(dailyVolume).map(([day, count]) => ({ day, count })),
      campaignBreakdown: Object.entries(campaignStats).map(([name, stats]) => ({ name, ...stats })),
      recentFailures: failures || []
    });
  } catch (err) {
    log.error('Performance stats error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

// R2: GET /api/wa/templates — Fetch templates from database
// Self-learning: auto-generates templates for new industries via Gemini
app.get('/api/wa/templates', requireAuth, async (req, res) => {
  try {
    const { industry } = req.query;
    let query = supabase.from('wa_templates').select('*').eq('is_active', true);
    if (industry) {
      query = query.or(`industry.eq.${industry},industry.eq.general`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Self-learning: if industry requested but no industry-specific templates exist, generate them
    if (industry && data && !data.some(t => t.industry === industry.toLowerCase())) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          log.info(`Auto-generating WA templates for new industry: "${industry}"`);
          const genRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Generate exactly 2 WhatsApp outreach message templates for a digital marketing agency reaching out to "${industry}" businesses in India. 
Format: Return ONLY a JSON array with 2 objects, each having "name" (string) and "body" (string) fields.
Template 1: Cold outreach intro. Template 2: Follow-up message.
Use {{business_name}} and {{city}} as placeholders. Keep messages casual, under 50 words each, and end with "— GrowthAI".
Output ONLY the JSON array, no markdown or explanation.` }] }] })
          });
          
          if (genRes.ok) {
            const genData = await genRes.json();
            const rawText = genData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            // Parse JSON from Gemini response (strip markdown fences if present)
            const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const templates = JSON.parse(cleanJson);
            
            if (Array.isArray(templates)) {
              const toInsert = templates.map((t, i) => ({
                name: t.name || `${industry} Template ${i + 1}`,
                body: t.body,
                industry: industry.toLowerCase(),
                category: i === 0 ? 'outreach' : 'followup',
                is_active: true
              }));
              
              const { data: newTemplates } = await supabase.from('wa_templates').insert(toInsert).select('*');
              if (newTemplates) {
                log.info(`✅ Auto-generated ${newTemplates.length} templates for "${industry}"`);
                data.push(...newTemplates);
              }
            }
          }
        } catch (genErr) {
          log.warn('Template auto-generation failed', { error: genErr.message });
        }
      }
    }

    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// R2: POST /api/wa/templates — Create a new template
app.post('/api/wa/templates', requireAuth, async (req, res) => {
  const { name, body, industry, category } = req.body;
  if (!name || !body) return res.status(400).json({ error: 'Name and body are required' });
  try {
    const { data, error } = await supabase.from('wa_templates').insert({
      name, body, industry: industry || 'general', category: category || 'outreach'
    }).select('*').single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// POST /api/wa/mark-sent - Resolve task from Extension
app.post('/api/wa/mark-sent', requireExtAuth, async (req, res) => {
  const { id } = req.body;
  try {
    const { error } = await supabase.from('pending_outreach').update({ status: 'sent' }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// ===================== LOGS & HISTORY API =====================

// GET /api/crm/stages
app.get('/api/crm/stages', requireAuth, (req, res) => {
  res.json({ stages: STAGES });
});

// GET /api/crm/leads
app.get('/api/crm/leads', requireAuth, async (req, res) => {
  try {
    const filters = {
      stage: req.query.stage || null,
      priority: req.query.priority || null,
      industry: req.query.industry || null,
      search: req.query.search || null
    };
    const result = await getLeads(filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pipeline leads: ' + err.message });
  }
});

// POST /api/crm/leads
app.post('/api/crm/leads', requireAuth, async (req, res) => {
  try {
    const id = await createLead(req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create lead: ' + err.message });
  }
});

// PUT /api/crm/leads/:id
app.put('/api/crm/leads/:id', requireAuth, async (req, res) => {
  try {
    const result = await updateLead(parseInt(req.params.id), req.body);
    if (!result) return res.status(404).json({ error: 'Lead not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead: ' + err.message });
  }
});

// DELETE /api/crm/leads/:id
app.delete('/api/crm/leads/:id', requireAuth, async (req, res) => {
  try {
    await deleteLead(parseInt(req.params.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lead: ' + err.message });
  }
});

// PATCH /api/crm/leads/:id/stage
app.patch('/api/crm/leads/:id/stage', requireAuth, async (req, res) => {
  try {
    const { stage } = req.body;
    await updateLead(parseInt(req.params.id), { stage });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stage: ' + err.message });
  }
});

// GET /api/crm/leads/:id/activities
app.get('/api/crm/leads/:id/activities', requireAuth, async (req, res) => {
  try {
    const activities = await getActivities(parseInt(req.params.id));
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities: ' + err.message });
  }
});

// POST /api/crm/leads/:id/activities
app.post('/api/crm/leads/:id/activities', requireAuth, async (req, res) => {
  try {
    const id = await addActivity(parseInt(req.params.id), req.body);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add activity: ' + err.message });
  }
});

// POST /api/crm/import
app.post('/api/crm/import', requireAuth, async (req, res) => {
  try {
    const imported = await importFromScraper();
    res.json({ success: true, imported, message: `${imported} new leads imported from scraper` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import leads: ' + err.message });
  }
});

// GET /api/crm/analytics
app.get('/api/crm/analytics', requireAuth, async (req, res) => {
  try {
    const analytics = await getAnalytics();
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics: ' + err.message });
  }
});

// F10: GET /api/crm/export — CSV export of CRM pipeline
app.get('/api/crm/export', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('pipeline_leads').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    
    const header = 'Business Name,Contact Name,Email,Phone,Website,Industry,Stage,Priority,Lead Score,Deal Value,Source,Notes,Created,Updated\n';
    const rows = (data || []).map(l => 
      [l.business_name, l.contact_name, l.email, l.phone, l.website, l.industry, l.stage, l.priority, l.lead_score, l.deal_value, l.source, `"${(l.notes || '').replace(/"/g, '""')}"`, l.created_at, l.updated_at].join(',')
    ).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=crm_pipeline_export.csv');
    res.send(header + rows);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Tracking endpoints (public — no auth)
app.get('/api/track/open/:trackingId', async (req, res) => {
  await trackOpen(req.params.trackingId);
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.end(pixel);
});

app.get('/api/track/click/:trackingId', async (req, res) => {
  await trackClick(req.params.trackingId);
  const redirect = req.query.url || '/';
  res.redirect(redirect);
});

// ===================== WHATSAPP AUTOMATION API =====================

// POST /api/wa/enroll — Start a sequence for a lead
app.post('/api/wa/enroll', requireAuth, async (req, res) => {
  const leadId = req.body.leadId || req.body.lead_id;
  const phone = req.body.phone;
  const bizName = req.body.bizName || req.body.biz_name;
  const city = req.body.city;
  
  if (!leadId || !phone) {
    return res.status(400).json({ error: 'Lead ID and Phone are required' });
  }

  try {
    // 1. Initial Enrollment
    const { data, error } = await supabase
      .from('wa_enrollments')
      .upsert({
        lead_id: leadId,
        phone,
        biz_name: bizName,
        city: city || 'your city',
        status: 'active',
        current_step: 1,
        next_run_at: new Date().toISOString() // Run immediately
      })
      .select('id').single();

    if (error) throw error;
    
    // 2. Trigger the processor immediately to send Day 1
    processSequences();
    
    res.json({ success: true, enrollmentId: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll in sequence: ' + err.message });
  }
});

// POST /api/wa/stop — Stop a sequence
app.post('/api/wa/stop', requireAuth, async (req, res) => {
  const leadId = req.body.leadId || req.body.lead_id;
  
  try {
    const { error } = await supabase
      .from('wa_enrollments')
      .update({ status: 'paused', next_run_at: null })
      .eq('lead_id', leadId);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop sequence: ' + err.message });
  }
});

// GET /api/wa/enrollments — List all active enrollments
app.get('/api/wa/enrollments', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wa_enrollments')
      .select('lead_id, status, current_step, next_run_at');
    
    if (error) throw error;
    res.json({ enrollments: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// GET /api/wa/stats — Aggregated Dashboard Numbers
app.get('/api/wa/stats', async (req, res) => {
  try {
    const { data: logs } = await supabase.from('wa_logs').select('status');
    const { data: enrolls } = await supabase.from('wa_enrollments').select('id').eq('status', 'active');
    
    const stats = {
      sent: logs?.length || 0,
      active: enrolls?.length || 0,
      success: logs?.filter(l => l.status === 'sent').length || 0,
      failed: logs?.filter(l => l.status === 'failed').length || 0
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/wa/logs — History Log
app.get('/api/wa/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('wa_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ===================== FRONTEND SERVING =====================
// Serve the built Vite frontend from /app/dist (production only)
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Catch-all: send index.html for any non-API route (React Router support)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/health')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
  console.log('📦 Serving frontend from:', distPath);
}

// ===================== HEALTH / CRON =====================

// X10: Health check with Supabase connectivity test
app.get('/health', async (req, res) => {
  try {
    const { error } = await supabase.from('businesses').select('id').limit(1);
    if (error) throw error;
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected', error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Auto-load SMTP config from database on startup
  try {
    await loadSmtpConfig();
  } catch (err) {
    console.warn('⚠️ SMTP config load skipped:', err.message);
  }

  // X1: node-cron — run sequence engine at 9am and 3pm daily (IST)
  cron.schedule('0 9,15 * * *', () => {
    console.log('[CRON] Running processSequences() — scheduled daily run');
    processSequences();
  }, { timezone: 'Asia/Kolkata' });

  // Also run on boot for immediate processing
  processSequences();
  
  console.log('[CRON] ✅ Sequence engine scheduled for 9:00 AM and 3:00 PM IST daily');
});

// JSON 404 Handler (Phase 9 Polish)
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found on this server.` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER-ERROR]', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});
