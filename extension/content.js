// content.js - Injected into web.whatsapp.com

console.log("GrowthAI Agent connected to WhatsApp Web.");

// ==========================================
// 1. DOM Reply Detection (MutationObserver)
// ==========================================

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      // Look for the "unread message" badge based on aria-label
      // This is the robust selector recommended by GPT!
      const unreadBadge = document.querySelector('[aria-label*="unread message"]');
      
      if (unreadBadge) {
        // Traverse DOM to find the phone number / contact name of the unread chat
        // WhatsApp DOM structure changes slightly, but usually it's in a parent container
        const chatRow = unreadBadge.closest('div[role="listitem"]');
        if (chatRow) {
          const titleEl = chatRow.querySelector('span[title]');
          if (titleEl) {
            const senderId = titleEl.getAttribute('title');
            console.log(`[GrowthAI] Unread message detected from: ${senderId}`);
            
            // Send payload to background.js
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
    console.log("Found WhatsApp Chat List! Starting observer.");
    observer.observe(pane, { childList: true, subtree: true });
    clearInterval(checkAndObserve);
  }
}, 3000);


// ==========================================
// 2. Automate Sending (Triggered by Background)
// ==========================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEND_WHATSAPP") {
    console.log(`Executing background sequence task for: ${message.phone}`);
    // Simulate clicking and typing to send `message.payload`
    sendResponse({ success: true, status: "DOM Click simulated." });
  }
});
