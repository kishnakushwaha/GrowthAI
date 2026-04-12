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
  // In a full implementation, you would hit your Express backend:
  // const response = await fetch(`${API_BASE_URL}/extension/pending-tasks`);
  // const tasks = await response.json();
  
  // For now, we will wait until the backend endpoints are built.
}

// Listen for messages from the content script (e.g., when a reply is detected)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REPLY_DETECTED") {
    console.log("🔥 Reply detected from:", message.phone);
    // Send to backend to update outreach_log:
    // fetch(`${API_BASE_URL}/extension/log-reply`, { method: 'POST', body: JSON.stringify(message) })
  }
});
