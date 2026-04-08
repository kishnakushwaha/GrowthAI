import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import { pullLocalAuth, pushLocalAuth, clearLocalAuth } from './supabaseAuth.js';
import qrcode from 'qrcode-terminal';
import supabase from './supabaseClient.js';

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

// Explicit CORS preflight for Auth headers
app.options('*', cors());

let waClient;
let isReady = false;
let currentQr = null;

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Kishna@321';

// ----------------------
// AUTH MIDDLEWARE
// ----------------------
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  next();
};

const idCache = new Map();

async function startWhatsApp() {
  // Sync the previous session from Supabase (if any) before booting!
  await pullLocalAuth();

  waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/123.0.0.0'
      ]
    }
  });

  waClient.on('qr', (qr) => {
    console.log('[WA] QR Code Generated! Waiting for scan...');
    qrcode.generate(qr, { small: true });
    currentQr = qr;
  });

  waClient.on('ready', async () => {
    console.log('[WA] Client is ready!');
    isReady = true;
    currentQr = null;
    
    // As soon as we successfully spin up and authenticate, push the fresh session to Supabase!
    // We delay slightly to let file operations inside LocalAuth finish.
    setTimeout(() => {
      pushLocalAuth();
    }, 5000);
  });

  waClient.on('authenticated', () => {
    console.log('[WA] Authenticated successfully! Processing messages... (this can take a minute)');
    currentQr = null; // Hide QR code on frontend while waiting for 'ready'
  });

  waClient.on('auth_failure', () => {
    console.error('[WA] Authentication failure! Please re-scan QR code.');
    // If the session died or was revoked, we should wipe the db so we cleanly start over next time
    isReady = false;
  });

  waClient.on('disconnected', (reason) => {
    console.log('[WA] Client was logged out or disconnected:', reason);
    isReady = false;
    idCache.clear(); // Clear cache on logout to be safe
  });

  waClient.initialize();
}

// ----------------------
// EXPRESS API ENDPOINTS
// ----------------------

// 1. Keep-Alive / Health Endpoint
app.get('/ping', (req, res) => res.send('pong'));

// 2. Auth Verification Endpoint
app.post('/api/auth/verify', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});


// 2. Status Endpoint (Used by GrowthAI Frontend)
app.get('/api/wa/status', (req, res) => {
  res.json({
    connected: isReady,
    qr: currentQr
  });
});

// 3. Send Message Endpoint
app.post('/api/wa/send', async (req, res) => {
  if (!isReady) {
    return res.status(400).json({ success: false, error: 'WhatsApp Engine is not connected.' });
  }

  try {
    const { phone, message, bizName, leadId } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'Phone and message required.' });
    }

    // Clean the phone number to digits only
    let cleanedPhone = phone.replace(/[^0-9]/g, '');
    
    // Add India country code if it's a 10-digit number
    if (cleanedPhone.length === 10) {
      cleanedPhone = '91' + cleanedPhone;
    }

    let serializedId = idCache.get(cleanedPhone);

    if (!serializedId) {
      console.log(`[WA] Cache miss for ${cleanedPhone}, looking up ID...`);
      const startTime = Date.now();
      const numberId = await waClient.getNumberId(cleanedPhone);
      const lookupTime = Date.now() - startTime;
      
      if (!numberId) {
        console.log(`[WA] Number ${cleanedPhone} is not registered on WhatsApp`);
        return res.status(400).json({ success: false, error: 'This number is not registered on WhatsApp.' });
      }
      
      serializedId = numberId._serialized;
      idCache.set(cleanedPhone, serializedId);
      console.log(`[WA] Resolved ID for ${cleanedPhone} in ${lookupTime}ms`);
    } else {
      console.log(`[WA] Cache hit for ${cleanedPhone}!`);
    }

    const sendStartTime = Date.now();
    await waClient.sendMessage(serializedId, message);
    const sendTime = Date.now() - sendStartTime;
    
    console.log(`[WA] ✅ Sent message to ${cleanedPhone} in ${sendTime}ms`);
    
    // Log to Supabase wa_logs for Activity tracking
    try {
      await supabase.from('wa_logs').insert({
        phone: cleanedPhone,
        biz_name: bizName || 'Unknown',
        message: message.substring(0, 500),
        type: 'manual',
        status: 'sent',
        lead_id: leadId || null
      });
      console.log(`[WA] 📝 Logged message to wa_logs`);
    } catch (logErr) {
      console.error('[WA] Failed to log message:', logErr.message);
    }
    
    res.json({ success: true, message: 'Message sent successfully!', total_ms: Date.now() });
  } catch (error) {
    console.error('[WA] Send error:', error);
    
    // Log failed attempt too
    try {
      const { phone, bizName, message, leadId } = req.body;
      await supabase.from('wa_logs').insert({
        phone: phone?.replace(/[^0-9]/g, '') || 'unknown',
        biz_name: bizName || 'Unknown',
        message: (message || '').substring(0, 500),
        type: 'manual',
        status: 'failed',
        lead_id: leadId || null
      });
    } catch (e) {}
    
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Disconnect Endpoint
app.post('/api/wa/disconnect', requireAuth, async (req, res) => {
  try {
    console.log('[WA] Disconnection/Logout requested...');
    isReady = false;
    currentQr = null;
    
    if (waClient) {
      // Catch any errors from Chromium if it's already dead
      try {
        await waClient.logout();
        await waClient.destroy();
      } catch(e) {
        console.log('[WA] Client logout/destroy error (safe to ignore):', e.message);
      }
    }
    
    // Wipe auth completely
    await clearLocalAuth();
    
    res.json({ success: true, message: 'Disconnected successfully.' });
    
    // Reboot the service so a new fresh QR code is generated!
    setTimeout(() => {
      console.log('[WA] Rebooting fresh WhatsApp Engine instance...');
      startWhatsApp();
    }, 3000);
    
  } catch (error) {
    console.error('[WA] Disconnect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4b. Reconnect Endpoint — Force re-initialize to get a new QR code
app.post('/api/wa/reconnect', requireAuth, async (req, res) => {
  try {
    console.log('[WA] Reconnection requested — clearing old session...');
    isReady = false;
    currentQr = null;

    if (waClient) {
      try {
        await waClient.destroy();
      } catch (e) {
        console.log('[WA] Client destroy error (safe to ignore):', e.message);
      }
    }

    // Clear old auth data
    await clearLocalAuth();

    res.json({ success: true, message: 'Reconnecting... QR code will appear shortly.' });

    // Reboot WhatsApp Engine after a brief delay
    setTimeout(() => {
      console.log('[WA] Booting fresh WhatsApp Engine for new QR...');
      startWhatsApp();
    }, 2000);

  } catch (error) {
    console.error('[WA] Reconnect error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// 5. Dashboard Stats
app.get('/api/wa/stats', async (req, res) => {
  try {
    if (!supabase) return res.json({ sent: 0, active: 0, success: 0, failed: 0 });
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
    console.error('[WA] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 6. Dashboard Logs  
app.get('/api/wa/logs', async (req, res) => {
  try {
    if (!supabase) return res.json({ logs: [] });
    const { data, error } = await supabase
      .from('wa_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
      
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (err) {
    console.error('[WA] Logs error:', err.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// 6b. Get list of all sent phone numbers (for duplicate prevention)
app.get('/api/wa/sent-phones', async (req, res) => {
  try {
    if (!supabase) return res.json({ phones: [] });
    const { data, error } = await supabase
      .from('wa_logs')
      .select('phone, biz_name, status, created_at')
      .eq('status', 'sent')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Build a map of unique phones with their latest send info
    const phoneMap = {};
    (data || []).forEach(log => {
      if (!phoneMap[log.phone]) {
        phoneMap[log.phone] = {
          phone: log.phone,
          biz_name: log.biz_name,
          last_sent: log.created_at,
          count: 1
        };
      } else {
        phoneMap[log.phone].count++;
      }
    });
    
    res.json({ phones: Object.values(phoneMap) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sent phones' });
  }
});

// 7. Enroll a lead in the WA sequence
app.post('/api/wa/enroll', requireAuth, async (req, res) => {
  const leadId = req.body.leadId || req.body.lead_id;
  const phone = req.body.phone;
  const bizName = req.body.bizName || req.body.biz_name;
  const city = req.body.city;

  if (!leadId || !phone) {
    return res.status(400).json({ error: 'Lead ID and Phone are required' });
  }

  try {
    const { data, error } = await supabase
      .from('wa_enrollments')
      .upsert({
        lead_id: leadId,
        phone,
        biz_name: bizName,
        city: city || 'your city',
        status: 'active',
        current_step: 1,
        next_run_at: new Date().toISOString()
      })
      .select('id').single();

    if (error) throw error;
    
    // Try to send Day 1 message immediately
    if (isReady) {
      try {
        await sendSequenceStep(leadId, phone, bizName, city, 1);
      } catch (e) {
        console.log('[WA] Day 1 auto-send failed, will retry on next cycle:', e.message);
      }
    }
    
    res.json({ success: true, enrollmentId: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll: ' + err.message });
  }
});

// 8. Stop a sequence
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
    res.status(500).json({ error: 'Failed to stop: ' + err.message });
  }
});

// 9. List enrollments
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

// Sequence step templates
const SEQUENCE_STEPS = [
  { step: 1, delayDays: 0, body: `Hi [[contact_name]],\n\nI came across [[business_name]] while reviewing businesses in [[city]].\n\nI noticed a few missed opportunities where you could get more enquiries from Google search & Meta Ads.\n\nI prepared a short visibility report for your business.\n\nCan I share it here?` },
  { step: 2, delayDays: 2, body: `Hi [[contact_name]],\n\nJust checking again — while reviewing [[business_name]], I noticed competitors in [[city]] are already capturing leads from Google searches that your business could also receive.\n\nI included those keywords inside the report I prepared.\n\nShould I send it here?` },
  { step: 3, delayDays: 4, body: `Hi [[contact_name]],\n\nLast message from my side 🙂\n\nWe recently helped similar businesses improve enquiry flow through Google visibility improvements and targeted ads.\n\nI had prepared a quick suggestion report for [[business_name]] as well.\n\nLet me know if you'd like me to share it.` }
];

// Send a single sequence step
async function sendSequenceStep(leadId, phone, bizName, city, step) {
  const stepConfig = SEQUENCE_STEPS.find(s => s.step === step);
  if (!stepConfig) return;

  let message = stepConfig.body
    .replace(/\[\[contact_name\]\]/g, bizName?.split(' ')[0] || 'Team')
    .replace(/\[\[business_name\]\]/g, bizName || 'your business')
    .replace(/\[\[city\]\]/g, city || 'your city');

  // Clean phone
  let cleanedPhone = phone.replace(/[^0-9]/g, '');
  if (cleanedPhone.length === 10) cleanedPhone = '91' + cleanedPhone;

  let serializedId = idCache.get(cleanedPhone);
  if (!serializedId) {
    const numberId = await waClient.getNumberId(cleanedPhone);
    if (!numberId) throw new Error('Not on WhatsApp');
    serializedId = numberId._serialized;
    idCache.set(cleanedPhone, serializedId);
  }

  await waClient.sendMessage(serializedId, message);
  console.log(`[WA-SEQ] ✅ Step ${step} sent to ${cleanedPhone}`);

  // Log to wa_logs
  await supabase.from('wa_logs').insert({
    lead_id: leadId,
    phone,
    biz_name: bizName,
    message,
    type: 'automation',
    step,
    status: 'sent'
  }).then(({ error }) => { if (error) console.error('[WA-SEQ] Log error:', error.message); });

  // Advance enrollment
  const nextStep = step + 1;
  const nextConfig = SEQUENCE_STEPS.find(s => s.step === nextStep);
  if (nextConfig) {
    const nextRun = new Date();
    nextRun.setDate(nextRun.getDate() + nextConfig.delayDays);
    await supabase.from('wa_enrollments').update({
      current_step: nextStep,
      next_run_at: nextRun.toISOString(),
      last_sent_at: new Date().toISOString()
    }).eq('lead_id', leadId);
  } else {
    await supabase.from('wa_enrollments').update({
      status: 'completed',
      last_sent_at: new Date().toISOString()
    }).eq('lead_id', leadId);
  }
}

// Sequence processor - runs every 5 minutes
async function processSequences() {
  if (!isReady) return;
  console.log('[WA-SEQ] Running automation check...');
  try {
    const { data: enrollments, error } = await supabase
      .from('wa_enrollments')
      .select('*')
      .eq('status', 'active')
      .lte('next_run_at', new Date().toISOString());

    if (error || !enrollments?.length) return;
    console.log(`[WA-SEQ] Found ${enrollments.length} pending messages`);

    for (const e of enrollments) {
      try {
        await sendSequenceStep(e.lead_id, e.phone, e.biz_name, e.city, e.current_step);
      } catch (err) {
        console.error(`[WA-SEQ] Failed for ${e.phone}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[WA-SEQ] Fatal:', err.message);
  }
}

// Boot the API
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Service v1.6 listening on port ${PORT}`);
  startWhatsApp();
  // Run sequence processor every 5 minutes
  setInterval(processSequences, 5 * 60 * 1000);
});

