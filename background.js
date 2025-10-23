// TwitLog Background Service Worker

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('TwitLog installed successfully!');

    // Initialize storage
    chrome.storage.local.set({
      selectedPosts: [],
      installDate: new Date().toISOString()
    });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://x.com'
    });
  } else if (details.reason === 'update') {
    console.log('TwitLog updated to version ' + chrome.runtime.getManifest().version);
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportPosts') {
    handleExport(request.posts, sendResponse);
    return true;
  }

  if (request.action === 'getStats') {
    getStorageStats(sendResponse);
    return true;
  }
});

// Export handler
function handleExport(posts, sendResponse) {
  if (!posts || posts.length === 0) {
    sendResponse({ success: false, error: 'No posts to export' });
    return;
  }

  const jsonl = posts.map(post => JSON.stringify(post)).join('\n');
  const blob = new Blob([jsonl], { type: 'application/jsonl' });
  const url = URL.createObjectURL(blob);
  const filename = `twitlog_${new Date().toISOString().split('T')[0]}_${posts.length}posts.jsonl`;

  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      sendResponse({ success: false, error: chrome.runtime.lastError.message });
    } else {
      sendResponse({ success: true, downloadId: downloadId });
    }
  });
}

// Get storage statistics
function getStorageStats(sendResponse) {
  chrome.storage.local.get(['selectedPosts', 'installDate'], (result) => {
    const stats = {
      totalPosts: result.selectedPosts ? result.selectedPosts.length : 0,
      installDate: result.installDate || 'Unknown'
    };
    sendResponse(stats);
  });
}

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

console.log('TwitLog background service worker initialized');
