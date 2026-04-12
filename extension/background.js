// background.js - GrowthAI Agent
// Polls the backend for sequence jobs, and commands the content script to execute them.

const API_BASE_URL = "http://localhost:3000/api"; // Will change for production

chrome.runtime.onInstalled.addListener(() => {
  console.log("GrowthAI Automation Agent Installed.");
  // Check for pending drip sequence messages every 2 minutes
  chrome.alarms.create("pollBackend", { periodInMinutes: 2.0 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pollBackend") {
    pollForTasks();
  }
});

async function pollForTasks() {
  console.log("Polling backend for pending sequence tasks...");
  try {
    const response = await fetch(`${API_BASE_URL}/extension/pending-tasks`);
    const tasks = await response.json();
    
    if (tasks && tasks.length > 0) {
      console.log(`Found ${tasks.length} pending tasks!`);
      // Here you would find a WhatsApp Web tab and inject a SEND_WHATSAPP command
      // For now we just log them.
      for (const t of tasks) {
         console.log("Pending:", t);
      }
    }
  } catch (e) {
    console.error("Failed to poll backend:", e);
  }
}

// Listen for messages from the content script (e.g., when a reply is detected)
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "REPLY_DETECTED") {
    console.log("🔥 Reply detected from:", message.phone);
    try {
      await fetch(`${API_BASE_URL}/extension/log-reply`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: message.phone }) 
      });
      console.log("Successfully logged reply to Supabase!");
    } catch(e) {
      console.error("Failed to push reply to backend", e);
    }
  }
});
