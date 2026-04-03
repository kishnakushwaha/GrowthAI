require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { pullLocalAuth, pushLocalAuth } = require('./supabaseAuth');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(cors());
app.use(express.json());

let waClient;
let isReady = false;
let currentQr = null;

async function startWhatsApp() {
  // Sync the previous session from Supabase (if any) before booting!
  await pullLocalAuth();

  waClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu']
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
  });

  waClient.initialize();
}

// ----------------------
// EXPRESS API ENDPOINTS
// ----------------------

// 1. Keep-Alive / Health Endpoint
app.get('/ping', (req, res) => res.send('pong'));

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

    // WhatsApp identifiers require country code suffix @c.us
    // Format input (e.g. "919876543210" -> "919876543210@c.us")
    let cleanedPhone = phone.replace(/[^0-9]/g, '');
    const chatId = `${cleanedPhone}@c.us`;

    await waClient.sendMessage(chatId, message);
    console.log(`[WA] Sent message to ${cleanedPhone}`);
    
    res.json({ success: true, message: 'Message queued to WhatsApp' });
  } catch (error) {
    console.error('[WA] Send error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Boot the API
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Service listening on port ${PORT}`);
  startWhatsApp();
});
