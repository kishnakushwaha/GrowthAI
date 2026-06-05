import 'dotenv/config';
import fetch from 'node-fetch';

async function testTelegram() {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  console.log(`TELEGRAM_BOT_TOKEN exists: ${!!TELEGRAM_BOT_TOKEN}`);
  console.log(`TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID}`);

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Missing bot token or chat ID in .env");
    process.exit(1);
  }

  const chatIds = TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(Boolean);
  console.log(`Found ${chatIds.length} Chat IDs to test:`, chatIds);

  for (const chatId of chatIds) {
    console.log(`\nSending test message to Chat ID: ${chatId}...`);
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔔 *GrowthAI Connection Test*\n\nThis is a test notification verifying that Chat ID *${chatId}* is successfully configured in the GrowthAI `.env` file.\n\nStatus: Online ✅`,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        console.log(`✅ Message successfully delivered to ${chatId}!`);
        console.log(`   Recipient Name: ${data.result.chat.first_name || ''} ${data.result.chat.last_name || ''} (${data.result.chat.username || 'No Username'})`);
      } else {
        console.error(`❌ Failed to deliver to ${chatId}:`, data);
      }
    } catch (err) {
      console.error(`💥 Exception while sending to ${chatId}:`, err.message);
    }
  }
}

testTelegram();
