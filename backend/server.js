import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { runAudit } from './auditEngine.js';
import supabase from './supabaseClient.js';
import { configureSmtp, getTransporter, getSmtpEmail, sendEmail, renderTemplate, trackOpen, trackClick, loadSmtpConfig } from './emailEngine.js';
import { STAGES, getLeads, createLead, updateLead, deleteLead, getActivities, addActivity, importFromScraper, getAnalytics } from './crmEngine.js';
import { processSequences } from './waSequenceEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Global Request Logger for Debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const CONTENT_FILE = path.join(__dirname, 'content.json');
const SCRAPER_DIR = path.join(__dirname, '..', 'scraper');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('❌ ADMIN_PASSWORD must be set as an environment variable!');
  process.exit(1);
}

// Track active scrape jobs
const activeJobs = {};

// ===================== AUTH MIDDLEWARE =====================
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  next();
};

app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
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

    let query = supabase.from('businesses').select('*', { count: 'exact' });

    if (industry) query = query.ilike('industry', `%${industry}%`);
    if (min_rating) query = query.gte('rating', parseFloat(min_rating));
    if (hot_only === 'true') query = query.eq('is_hot_lead', true);
    if (no_website === 'true') query = query.or("website.is.null,website.eq.,website.eq.N/A");
    if (low_reviews === 'true') query = query.lt('reviews', 15);
    if (search) {
      query = query.or(`place_name.ilike.%${search}%,address.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Sorting
    const allowedSorts = ['place_name', 'rating', 'reviews', 'scraped_at', 'is_hot_lead'];
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
      hot_leads: all.filter(b => b.is_hot_lead).length,
      no_website: all.filter(b => !b.website || b.website === 'N/A' || b.website === '').length,
      avg_rating: all.length > 0
        ? (all.filter(b => b.rating).reduce((s, b) => s + (parseFloat(b.rating) || 0), 0) / all.filter(b => b.rating).length).toFixed(1)
        : 0
    };

    // Industries
    const industries = [...new Set(all.map(b => b.industry).filter(Boolean))].sort();

    res.json({ leads: leads || [], total: total || 0, stats, industries });
  } catch (error) {
    console.error('Leads fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/leads/export — Export CSV
app.get('/api/leads/export', requireAuth, async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .from('businesses')
      .select('*')
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
    const proc = spawn(pythonPath, [scraperScript, job.query, job.target_count.toString()], {
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
    const { data, error } = await supabase.from('scrape_jobs').insert({
      query,
      target_count: count
    }).select('id').single();

    if (error) throw error;

    res.json({ jobId: data.id.toString(), message: `Scrape queued for "${query}" (${count} leads)` });
  } catch (err) {
    console.error('Failed to queue job', err);
    res.status(500).json({ error: 'Failed to queue job' });
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

// ===================== AUDIT API (Supabase) =====================

// POST /api/audit — Run a website audit (public — no auth needed)
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

// ===================== CRM / PIPELINE API =====================

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

// ===================== HEALTH / CRON ENDPOINT =====================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  
  // Auto-load SMTP config from database on startup
  try {
    await loadSmtpConfig();
    
    // Start the WhatsApp Sequence Engine Check (Runs every 1 hour)
    setInterval(() => {
      processSequences();
    }, 1000 * 60 * 60);

    // Initial check on boot
    processSequences();
    
  } catch (err) {
    console.warn('⚠️ Initialization skipped:', err.message);
  }
});
