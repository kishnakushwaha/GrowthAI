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
    const { phone, message } = req.body;
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
    
    res.json({ success: true, message: 'Message sent successfully!', total_ms: Date.now() });
  } catch (error) {
    console.error('[WA] Send error:', error);
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

// 5. Dashboard Stats
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

// 6. Dashboard Logs
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


// Boot the API — Use process.env.PORT (from .env) or fallback to 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Service v1.5 listening on port ${PORT}`);
  startWhatsApp();
});

