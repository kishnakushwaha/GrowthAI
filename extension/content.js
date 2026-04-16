// content.js - GrowthAI Autonomous WhatsApp Agent v2.0
// Injected into web.whatsapp.com
// Handles: auto-sending deep-linked messages, reply detection, and reporting back to background.js

console.log("GrowthAI Agent v2.0 connected to WhatsApp Web.");

// ==========================================
// 1. DOM Reply Detection (MutationObserver)
// ==========================================

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      const unreadBadge = document.querySelector('[aria-label*="unread message"]');
      
      if (unreadBadge) {
        const chatRow = unreadBadge.closest('div[role="listitem"]');
        if (chatRow) {
          const titleEl = chatRow.querySelector('span[title]');
          if (titleEl) {
            const senderId = titleEl.getAttribute('title');
            console.log(`[GrowthAI] Unread message detected from: ${senderId}`);
            
            chrome.runtime.sendMessage({
              type: "REPLY_DETECTED",
              channel: "whatsapp",
              phone: senderId,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
  }
});

// Start observing the chat list panel once it loads
const checkAndObserve = setInterval(() => {
  const pane = document.querySelector('div[aria-label="Chat list"]');
  if (pane) {
    console.log("[GrowthAI] Found WhatsApp Chat List! Starting observer.");
    observer.observe(pane, { childList: true, subtree: true });
    clearInterval(checkAndObserve);
  }
}, 3000);


// ==========================================
// 2. Autonomous Auto-Send (Deep-Link Triggered)
// ==========================================

const urlParams = new URLSearchParams(window.location.search);
const autoSend = urlParams.get('auto_send');
const taskId = urlParams.get('task_id');
const taskType = urlParams.get('task_type');

if (autoSend === 'true') {
  console.log(`[GrowthAI] 🤖 Auto-Send triggered! Task: ${taskId} Type: ${taskType}`);
  
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds timeout

  const clickSendInterval = setInterval(() => {
    attempts++;

    // X3: Resilience fallback array — WhatsApp updates DOM frequently
    const SEND_SELECTORS = [
      'span[data-icon="send"]',
      'button[aria-label="Send"]',
      '[data-testid="send"]',
      'span[data-icon="msg-send"]'
    ];

    let sendBtn = null;
    for (const sel of SEND_SELECTORS) {
      sendBtn = document.querySelector(sel);
      if (sendBtn) break;
    }
                    
    if (sendBtn) {
      console.log("[GrowthAI] Send button found! Clicking now.");
      const clickableElement = sendBtn.closest('div[role="button"], button');
      if (clickableElement) {
        clickableElement.click();
        console.log("[GrowthAI] ✅ Message auto-sent successfully!");
        clearInterval(clickSendInterval);

        // Report success back to background.js for queue progression
        chrome.runtime.sendMessage({
          type: "SEND_COMPLETE",
          task_id: taskId,
          task_type: taskType,
          biz_name: "auto",
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Stop trying after timeout
    if (attempts > maxAttempts) {
      console.warn("[GrowthAI] ⚠️ Send button not found after 30s. Reporting failure.");
      clearInterval(clickSendInterval);
      
      // Report failure back to background.js
      chrome.runtime.sendMessage({
        type: "SEND_FAILED",
        task_id: taskId,
        phone: urlParams.get('phone') || 'unknown',
        reason: "Send button not found within timeout"
      });
    }
  }, 1000);
}

// ==========================================
// 3. Background Listener (Legacy Fallback)
// ==========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEND_WHATSAPP") {
    console.log(`[GrowthAI] Legacy send request for: ${message.phone}`);
    sendResponse({ success: true, status: "Using deep-link dispatch." });
  }
});
