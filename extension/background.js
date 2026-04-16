// background.js - GrowthAI Autonomous Agent v2.1
// Polls the backend for AI-generated sequence messages and automatically dispatches them
// via WhatsApp Web deep-links. The content script handles the actual DOM click.

// X7: Configurable via chrome.storage — defaults below used until overridden
const DEFAULTS = {
  mode: 'production',
  localUrl: 'http://localhost:3001/api',
  prodUrl: 'https://growthai-backend-814429723132.asia-south1.run.app/api',
  token: 'Kishna@321'
};

let API_BASE_URL = DEFAULTS.prodUrl;
let AUTH_HEADERS = { 'Content-Type': 'application/json', 'x-extension-token': DEFAULTS.token };

// Load config from storage (overrides defaults if set)
chrome.storage.sync.get(['growthai_mode', 'growthai_url', 'growthai_token'], (cfg) => {
  const mode = cfg.growthai_mode || DEFAULTS.mode;
  API_BASE_URL = cfg.growthai_url || (mode === 'local' ? DEFAULTS.localUrl : DEFAULTS.prodUrl);
  const token = cfg.growthai_token || DEFAULTS.token;
  AUTH_HEADERS = { 'Content-Type': 'application/json', 'x-extension-token': token };
  console.log(`[GrowthAI] Config loaded: ${mode} mode → ${API_BASE_URL}`);
});

// Queue of tasks waiting to be dispatched
let pendingQueue = [];
let isDispatching = false;
let emptyPollCount = 0; // X6: Track consecutive empty polls

chrome.runtime.onInstalled.addListener(() => {
  console.log("GrowthAI Autonomous Agent v2.1 Installed.");
  // Start polling every 2 minutes
  chrome.alarms.create("pollBackend", { periodInMinutes: 2.0 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pollBackend") {
    pollForTasks();
  }
});

// X6: Smart backoff — reduce polling frequency when idle
function adjustPollingRate(hasTasks, hadError = false) {
  let newInterval = 2.0; // default: 2 minutes
  
  if (hadError) {
    newInterval = 30.0; // Backend error: back off to 30 min
    console.log("[GrowthAI] ⚠️ Backend error — backing off to 30 min polls");
  } else if (!hasTasks) {
    emptyPollCount++;
    if (emptyPollCount >= 3) {
      newInterval = 10.0; // 3+ empty polls: slow to 10 min
      console.log(`[GrowthAI] 💤 ${emptyPollCount} empty polls — slowing to 10 min`);
    }
  } else {
    emptyPollCount = 0; // Reset on tasks found
    newInterval = 2.0;
    console.log("[GrowthAI] 🔥 Tasks found — polling at 2 min");
  }
  
  // Re-create alarm with new interval
  chrome.alarms.create("pollBackend", { periodInMinutes: newInterval });
}

async function pollForTasks() {
  if (isDispatching) {
    console.log("[GrowthAI] Already dispatching, skipping poll cycle.");
    return;
  }

  console.log("[GrowthAI] Polling backend for pending AI messages...");
  try {
    const response = await fetch(`${API_BASE_URL}/extension/pending-tasks`, { headers: AUTH_HEADERS });
    
    // X6: Detect server errors and back off
    if (!response.ok) {
      console.error(`[GrowthAI] Backend returned ${response.status}`);
      adjustPollingRate(false, true);
      return;
    }
    
    const tasks = await response.json();
    
    if (tasks && tasks.length > 0) {
      console.log(`[GrowthAI] 🔥 Found ${tasks.length} pending tasks! Starting dispatch...`);
      pendingQueue = tasks;
      adjustPollingRate(true);
      dispatchNext();
    } else {
      console.log("[GrowthAI] No pending tasks.");
      adjustPollingRate(false);
    }
  } catch (e) {
    console.error("[GrowthAI] Poll failed:", e);
    adjustPollingRate(false, true);
  }
}

async function dispatchNext() {
  if (pendingQueue.length === 0) {
    console.log("[GrowthAI] ✅ All tasks dispatched! Queue empty.");
    isDispatching = false;
    return;
  }

  isDispatching = true;
  const task = pendingQueue.shift();
  
  // Clean the phone number
  let phone = (task.phone || '').replace(/[^0-9]/g, '');
  if (phone.length === 10) phone = '91' + phone;

  // Encode the message for WhatsApp deep-link
  const encodedMsg = encodeURIComponent(task.message || '');
  const waUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMsg}&auto_send=true&task_id=${task.id}&task_type=${task.type}`;
  
  console.log(`[GrowthAI] Dispatching to ${task.biz_name} (${phone})...`);

  // Find existing WhatsApp Web tab or create one
  try {
    const tabs = await chrome.tabs.query({ url: "https://web.whatsapp.com/*" });
    
    if (tabs.length > 0) {
      // Navigate existing tab to the deep-link
      await chrome.tabs.update(tabs[0].id, { url: waUrl, active: false });
      console.log(`[GrowthAI] Redirected existing WA tab for: ${task.biz_name}`);
    } else {
      // Open a new WhatsApp Web tab
      await chrome.tabs.create({ url: waUrl, active: false });
      console.log(`[GrowthAI] Opened new WA tab for: ${task.biz_name}`);
    }
  } catch (err) {
    console.error(`[GrowthAI] Tab dispatch error:`, err);
    // Don't block the queue; try the next one after a delay
    setTimeout(dispatchNext, 5000);
  }
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  // Content script reports a send was completed
  if (message.type === "SEND_COMPLETE") {
    console.log(`[GrowthAI] ✅ Message sent to ${message.biz_name} (task ${message.task_id})`);
    
    // Mark the task as sent in the backend
    try {
      await fetch(`${API_BASE_URL}/wa/mark-sent`, {
        method: 'POST',
        headers: AUTH_HEADERS,
        body: JSON.stringify({ id: parseInt(message.task_id) })
      });
      console.log(`[GrowthAI] Backend updated: task ${message.task_id} marked as sent.`);
    } catch (e) {
      console.error("[GrowthAI] Failed to mark-sent:", e);
    }

    // Wait 15-30 seconds (randomized human delay) before dispatching next
    const delay = 15000 + Math.floor(Math.random() * 15000);
    console.log(`[GrowthAI] Waiting ${Math.round(delay/1000)}s before next dispatch...`);
    setTimeout(dispatchNext, delay);
  }

  // Content script reports a send failure
  if (message.type === "SEND_FAILED") {
    console.warn(`[GrowthAI] ⚠️ Failed to send to ${message.phone}: ${message.reason}`);
    // Move on to next task after a shorter delay
    setTimeout(dispatchNext, 5000);
  }

  // Reply detection (existing functionality)
  if (message.type === "REPLY_DETECTED") {
    console.log("🔥 Reply detected from:", message.phone);
    try {
      await fetch(`${API_BASE_URL}/extension/log-reply`, { 
        method: 'POST', 
        headers: AUTH_HEADERS,
        body: JSON.stringify({ phone: message.phone }) 
      });
      console.log("Successfully logged reply to Supabase!");
    } catch(e) {
      console.error("Failed to push reply to backend", e);
    }
  }
});
