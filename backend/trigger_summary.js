import 'dotenv/config';
import supabase from './supabaseClient.js';
import { sendDailySummary } from './engines/telegramBot.js';

console.log('[TRIGGER] Generating daily summary and sending to Telegram...');
sendDailySummary(supabase)
  .then(() => {
    console.log('[TRIGGER] Daily summary sent successfully. Exiting in 3 seconds to allow requests to complete...');
    setTimeout(() => process.exit(0), 3000);
  })
  .catch((err) => {
    console.error('[TRIGGER] Error sending summary:', err);
    process.exit(1);
  });
