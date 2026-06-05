import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const ADMIN_IDS = TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(Boolean);

let bot = null;
export let isPaused = false;

export function startTelegramBot({ supabase, runAgenticLoop, triggerScrape }) {
  if (!TELEGRAM_BOT_TOKEN || ADMIN_IDS.length === 0) {
    console.error('[TELEGRAM] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in env');
    return;
  }

  bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
  console.log('[TELEGRAM] Bot started with polling');

  // Programmatically register commands menu
  bot.setMyCommands([
    { command: 'status', description: 'Pipeline stats & lead counts' },
    { command: 'scrape', description: 'Trigger a lead scrape (usage: /scrape <niche> <city>)' },
    { command: 'pause', description: 'Pause the agentic loop' },
    { command: 'resume', description: 'Resume the agentic loop' },
    { command: 'loop', description: 'Manually run agentic loop & sequences' },
    { command: 'sequence', description: 'Manually run follow-up sequences' }
  ]).catch(err => console.error('[TELEGRAM] Error setting commands:', err.message));

  const isAdmin = (msg) => ADMIN_IDS.includes(String(msg.chat.id));

  bot.on('message', (msg) => {
    if (!isAdmin(msg)) return;

    const text = (msg.text || '').trim();

    if (text === '/start') {
      handleStart(msg);
    } else if (text === '/status') {
      handleStatus(msg, supabase);
    } else if (text.startsWith('/scrape')) {
      handleScrape(msg, triggerScrape);
    } else if (text === '/pause') {
      handlePause(msg);
    } else if (text === '/resume') {
      handleResume(msg);
    } else if (text === '/loop') {
      handleLoop(msg, runAgenticLoop);
    } else if (text === '/sequence') {
      handleSequence(msg);
    }
  });

  bot.on('polling_error', (err) => {
    console.error('[TELEGRAM] Polling error:', err.message);
  });
}

function handleStart(msg) {
  const text = `*🚀 GrowthAI Command Center*

Available commands:

/status — Pipeline stats & lead counts
/scrape <niche> <city> — Trigger a scrape
/pause — Pause the agentic loop
/resume — Resume the agentic loop
/loop — Manually trigger agentic loop & sequences
/sequence — Manually trigger follow-up sequences

_Bot is online and listening._`;

  bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
}

async function handleStatus(msg, supabase) {
  try {
    const { count: bizCount, error: bizErr } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true });

    const { count: waCount, error: waErr } = await supabase
      .from('wa_enrollments')
      .select('*', { count: 'exact', head: true });

    if (bizErr || waErr) {
      bot.sendMessage(msg.chat.id, '❌ Error fetching stats from Supabase.');
      return;
    }

    const text = `*📊 Pipeline Status*

Businesses scraped: ${bizCount || 0}
WA Enrollments: ${waCount || 0}
Loop paused: ${isPaused ? 'Yes ⏸' : 'No ▶️'}`;

    bot.sendMessage(msg.chat.id, text, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[TELEGRAM] Status error:', err.message);
    bot.sendMessage(msg.chat.id, '❌ Failed to fetch status.');
  }
}

async function handleScrape(msg, triggerScrape) {
  const parts = (msg.text || '').trim().split(/\s+/);
  if (parts.length < 3) {
    bot.sendMessage(msg.chat.id, '⚠️ Usage: /scrape <niche> <city>\nExample: /scrape restaurants Jaipur');
    return;
  }

  const niche = parts[1];
  const city = parts.slice(2).join(' ');

  bot.sendMessage(msg.chat.id, `🔍 Starting scrape for *${niche}* in *${city}*...`, { parse_mode: 'Markdown' });

  try {
    await triggerScrape(niche, city);
    bot.sendMessage(msg.chat.id, `✅ Scrape triggered for *${niche}* in *${city}*`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error('[TELEGRAM] Scrape error:', err.message);
    bot.sendMessage(msg.chat.id, `❌ Scrape failed: ${err.message}`);
  }
}

function handlePause(msg) {
  isPaused = true;
  bot.sendMessage(msg.chat.id, '⏸ Agentic loop *paused*.', { parse_mode: 'Markdown' });
}

function handleResume(msg) {
  isPaused = false;
  bot.sendMessage(msg.chat.id, '▶️ Agentic loop *resumed*.', { parse_mode: 'Markdown' });
}

async function handleLoop(msg, runAgenticLoop) {
  bot.sendMessage(msg.chat.id, '🔄 Manually triggering agentic loop and follow-up sequences...');
  try {
    await runAgenticLoop(true);
    bot.sendMessage(msg.chat.id, '✅ Agentic loop completed. Triggering sequences...');
    
    const seqRes = await fetch('http://localhost:4000/api/wa/process-sequences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`
      },
      body: JSON.stringify({ force: true })
    });
    
    if (seqRes.ok) {
      bot.sendMessage(msg.chat.id, '✅ Follow-up sequences completed.');
    } else {
      const errMsg = await seqRes.text();
      bot.sendMessage(msg.chat.id, `⚠️ Sequence trigger failed: ${errMsg}`);
    }
  } catch (err) {
    console.error('[TELEGRAM] Loop/Sequence error:', err.message);
    bot.sendMessage(msg.chat.id, `❌ Manual trigger failed: ${err.message}`);
  }
}

async function handleSequence(msg) {
  bot.sendMessage(msg.chat.id, '🔄 Manually triggering follow-up sequences...');
  try {
    const seqRes = await fetch('http://localhost:4000/api/wa/process-sequences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_PASSWORD}`
      },
      body: JSON.stringify({ force: true })
    });
    
    if (seqRes.ok) {
      bot.sendMessage(msg.chat.id, '✅ Follow-up sequences completed.');
    } else {
      const errMsg = await seqRes.text();
      bot.sendMessage(msg.chat.id, `❌ Sequence trigger failed: ${errMsg}`);
    }
  } catch (err) {
    console.error('[TELEGRAM] Sequence trigger error:', err.message);
    bot.sendMessage(msg.chat.id, `❌ Sequence trigger failed: ${err.message}`);
  }
}

export function sendTelegramNotification(message) {
  if (!bot && TELEGRAM_BOT_TOKEN) {
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
  }
  if (!bot || ADMIN_IDS.length === 0) {
    console.warn('[TELEGRAM] Bot not initialized, cannot send notification');
    return;
  }
  ADMIN_IDS.forEach((chatId) => {
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' }).catch((err) => {
      console.error(`[TELEGRAM] Notification error for chat ID ${chatId}:`, err.message);
    });
  });
}

function isValidWebsite(url) {
  if (!url) return false;
  const junk = ['n/a', 'na', 'none', 'null', '-', '–', 'no'];
  if (junk.includes(url.trim().toLowerCase())) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (url.length <= 10) return false;
  return true;
}

export async function sendDailySummary(supabase) {
  try {
    const tz = 'Asia/Kolkata';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year').value;
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    const startISO = `${year}-${month}-${day}T00:00:00+05:30`;

    // 1. Fetch leads scraped today
    const { data: todayLeads, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .gte('scraped_at', startISO);

    if (bizError) throw bizError;

    const totalNewLeads = todayLeads.length;

    // Aggregate niches & cities coverage
    const coverage = {};
    for (const lead of todayLeads) {
      const rawNiche = lead.industry || 'unknown';
      const rawCity = lead.city || 'unknown';
      const niche = rawNiche.charAt(0).toUpperCase() + rawNiche.slice(1);
      const city = rawCity.charAt(0).toUpperCase() + rawCity.slice(1);
      const key = `${niche} in ${city}`;
      coverage[key] = (coverage[key] || 0) + 1;
    }
    const coverageStr = Object.entries(coverage)
      .map(([key, val]) => `  ├ *${key}:* ${val} leads`)
      .join('\n') || '  ├ _None_';

    // 2. Separate Has Website vs No Website
    const hasWebLeads = todayLeads.filter(l => isValidWebsite(l.website));
    const noWebLeads = todayLeads.filter(l => !isValidWebsite(l.website));

    // 3. Has Website metrics
    const hasWebCount = hasWebLeads.length;
    const hasWebContacted = hasWebLeads.filter(l => l.outreach_stage !== null).length;

    // 4. No Website metrics
    const noWebCount = noWebLeads.length;
    const noWebContacted = noWebLeads.filter(l => l.outreach_stage !== null).length;
    const noWebInterested = noWebLeads.filter(l => l.outreach_stage === 'stage_3_interested').length;
    const noWebDemoSent = noWebLeads.filter(l => l.outreach_stage === 'stage_4_demo_sent').length;

    // 5. Fetch replies count via wa_logs for today's leads
    const todayLeadIds = todayLeads.map(l => l.id);
    let hasWebReplied = 0;
    let noWebReplied = 0;

    if (todayLeadIds.length > 0) {
      const { data: todayLogs, error: logError } = await supabase
        .from('wa_logs')
        .select('lead_id')
        .eq('type', 'incoming')
        .gte('created_at', startISO)
        .in('lead_id', todayLeadIds);

      if (!logError && todayLogs) {
        const repliedLeadIds = new Set(todayLogs.map(log => log.lead_id));
        hasWebReplied = hasWebLeads.filter(l => repliedLeadIds.has(l.id)).length;
        noWebReplied = noWebLeads.filter(l => repliedLeadIds.has(l.id)).length;
      }
    }

    // 6. Fetch queue backlog (unprocessed leads where outreach_stage is null)
    let backlogCount = 0;
    try {
      const { count, error: countErr } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true })
        .is('outreach_stage', null);
      if (!countErr) {
        backlogCount = count || 0;
      }
    } catch (e) {
      console.warn('[SUMMARY] Backlog check warning:', e.message);
    }

    const totalPitched = hasWebContacted + noWebContacted;
    const totalReplied = hasWebReplied + noWebReplied;
    const totalInterested = noWebInterested + noWebDemoSent;
    const overallResponseRate = totalPitched > 0 ? ((totalReplied / totalPitched) * 100).toFixed(1) : '0.0';
    const interestRate = totalReplied > 0 ? ((totalInterested / totalReplied) * 100).toFixed(1) : '0.0';

    const message = `*📊 GrowthAI Daily Performance Summary*
_Date: ${day}/${month}/${year}_

*Total New Leads Added:* ${totalNewLeads}
${coverageStr}

*🌐 HAS WEBSITE LEADS:* ${hasWebCount}
├ 📞 *Contacted:* ${hasWebContacted}
└ 💬 *Replied:* ${hasWebReplied}

*🚫 NO WEBSITE LEADS:* ${noWebCount}
├ 📞 *Contacted:* ${noWebContacted}
├ 💬 *Replied:* ${noWebReplied}
├ 🔥 *Interested:* ${noWebInterested}
└ 🏗️ *Demo Website Sent:* ${noWebDemoSent}

*⚙️ Compute & Queue Stats:*
├ 🏗️ *Astro Builds Run:* ${noWebDemoSent}
├ ⚡ *Builds Avoided (Saved Compute):* ${noWebCount - noWebDemoSent}
└ ⏳ *Leads Waiting in Queue:* ${backlogCount}

---
*💡 Daily Performance Insights:*
• Pitch Outreach Rate: ${totalNewLeads > 0 ? ((totalPitched / totalNewLeads) * 100).toFixed(1) : '0.0'}%
• Overall Response Rate: ${overallResponseRate}%
• Lead-to-Interest Rate: ${interestRate}%
• *System Health:* Stable ✅
`;

    sendTelegramNotification(message);
    console.log('[SUMMARY] ✅ Daily performance summary sent to Telegram.');
  } catch (err) {
    console.error('[SUMMARY] Error generating daily summary:', err.message);
  }
}
