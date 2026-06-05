import fetch from 'node-fetch';

/**
 * PHASE 10: Telegram Notification Module
 * Fires webhooks to the designated Telegram group when a hot lead replies.
 */

export async function sendTelegramAlert(leadData, replyMessage, aiAnalysis) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('⚠️ Telegram credentials missing. Cannot send alert.');
    return false;
  }

  // Handle multiple IDs if separated by commas (take the first or iterate)
  const chatIds = TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(Boolean);

  const text = `🚨 *HOT LEAD ALERT!* 🚨
  
*Business:* ${leadData.place_name || 'Unknown'}
*Phone:* ${leadData.phone || 'Unknown'}
*City:* ${leadData.search_city || leadData.city || 'Unknown'}

💬 *Customer Reply:* 
"${replyMessage}"

🤖 *AI Analysis:* ${aiAnalysis.reason || 'Interested'}

👉 *Action Required:* Log into the CRM and reply immediately to close this deal!`;

  try {
    let success = true;
    for (const chatId of chatIds) {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });

      if (!response.ok) {
        console.error(`Failed to send Telegram alert to ${chatId}:`, await response.text());
        success = false;
      } else {
        console.log(`[TELEGRAM] ✅ Alert sent to ${chatId} for lead ${leadData.phone}`);
      }
    }
    return success;
  } catch (err) {
    console.error('❌ Telegram Alert Error:', err.message);
    return false;
  }
}
