// TwitLog Auto Background Service Worker

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('TwitLog Auto installed successfully!');

    // Initialize storage
    chrome.storage.local.set({
      allTweets: [],
      capturedUrls: [],
      installDate: new Date().toISOString()
    });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://x.com'
    });
  } else if (details.reason === 'update') {
    console.log('TwitLog Auto updated to version ' + chrome.runtime.getManifest().version);
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'stop') {
    // Notify the content script to stop
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'stop' });
      }
    });
  }
});

// Keep service worker alive
let keepAliveInterval;

function keepAlive() {
  if (chrome.runtime?.id) {
    // Service worker is alive
  }
}

if (!keepAliveInterval) {
  keepAliveInterval = setInterval(keepAlive, 20000);
}

console.log('TwitLog Auto background service worker initialized');
