// TwitLog Auto - Automatic Tweet Capture with Human-like Scrolling

let isRunning = false;
let capturedTweets = new Set(); // Store tweet URLs to avoid duplicates
let allTweets = [];
let scrollInterval = null;
let statsInterval = null;

// Configuration for human-like scrolling
const SCROLL_CONFIG = {
  minScrollAmount: 300,
  maxScrollAmount: 800,
  minPauseDuration: 800,
  maxPauseDuration: 2500,
  readPauseDuration: 3000, // Longer pause to "read" content
  readPauseChance: 0.15, // 15% chance of longer pause
  smoothScrollDuration: 600
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    startCapture();
    sendResponse({ success: true, running: isRunning });
  } else if (request.action === 'stop') {
    stopCapture();
    sendResponse({ success: true, running: isRunning });
  } else if (request.action === 'getStats') {
    sendResponse({
      running: isRunning,
      count: allTweets.length,
      tweets: allTweets
    });
  } else if (request.action === 'clear') {
    clearData();
    sendResponse({ success: true });
  } else if (request.action === 'getStatus') {
    sendResponse({ running: isRunning });
  }
  return true;
});

function startCapture() {
  if (isRunning) return;

  isRunning = true;
  showStatusBar();

  // Start capturing tweets
  startTweetObserver();

  // Initial capture of visible tweets
  captureVisibleTweets();

  // Start auto-scrolling with human-like behavior
  startHumanLikeScrolling();

  // Update stats regularly
  statsInterval = setInterval(updateStats, 1000);

  console.log('TwitLog Auto: Started capturing tweets');
}

function stopCapture() {
  if (!isRunning) return;

  isRunning = false;
  hideStatusBar();

  // Stop scrolling
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }

  // Stop stats updates
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }

  // Stop observer
  if (window.tweetObserver) {
    window.tweetObserver.disconnect();
  }

  // Auto-export on stop
  if (allTweets.length > 0) {
    exportToJSONL();
  }

  console.log('TwitLog Auto: Stopped capturing. Total tweets:', allTweets.length);
}

function startHumanLikeScrolling() {
  function performScroll() {
    if (!isRunning) return;

    // Random scroll amount
    const scrollAmount = Math.random() *
      (SCROLL_CONFIG.maxScrollAmount - SCROLL_CONFIG.minScrollAmount) +
      SCROLL_CONFIG.minScrollAmount;

    // Smooth scroll
    window.scrollBy({
      top: scrollAmount,
      behavior: 'smooth'
    });

    // Capture any new tweets after scroll
    setTimeout(() => {
      captureVisibleTweets();
    }, SCROLL_CONFIG.smoothScrollDuration);

    // Determine pause duration (occasionally pause longer to "read")
    let pauseDuration;
    if (Math.random() < SCROLL_CONFIG.readPauseChance) {
      pauseDuration = SCROLL_CONFIG.readPauseDuration;
    } else {
      pauseDuration = Math.random() *
        (SCROLL_CONFIG.maxPauseDuration - SCROLL_CONFIG.minPauseDuration) +
        SCROLL_CONFIG.minPauseDuration;
    }

    // Check if we're at the bottom
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const clientHeight = window.innerHeight;

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      // At bottom, scroll back up a bit to trigger more loading
      window.scrollBy({
        top: -500,
        behavior: 'smooth'
      });
    }

    // Schedule next scroll
    scrollInterval = setTimeout(performScroll, pauseDuration);
  }

  // Start the scroll loop
  performScroll();
}

function startTweetObserver() {
  const observer = new MutationObserver((mutations) => {
    if (isRunning) {
      captureVisibleTweets();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.tweetObserver = observer;
}

function captureVisibleTweets() {
  const tweets = findAllTweets();

  tweets.forEach(tweet => {
    const data = extractTweetData(tweet);
    if (data && data.url && !capturedTweets.has(data.url)) {
      capturedTweets.add(data.url);
      allTweets.push(data);
      saveToStorage();
    }
  });
}

function findAllTweets() {
  return Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
}

function extractTweetData(tweetElement) {
  try {
    // Extract text content
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    const text = textElement ? textElement.innerText.trim() : '';

    // Skip if no text (e.g., media-only posts)
    if (!text) return null;

    // Extract username (without @)
    const usernameElement = tweetElement.querySelector('[data-testid="User-Name"] a[href^="/"]');
    const username = usernameElement ? usernameElement.getAttribute('href').substring(1).split('/')[0] : '';

    // Skip if we can't get username
    if (!username) return null;

    // Extract tweet URL for deduplication
    const linkElement = tweetElement.querySelector('a[href*="/status/"]');
    const url = linkElement ? 'https://x.com' + linkElement.getAttribute('href') : '';

    // Return simplified format
    return {
      user: username,
      text: text,
      url: url // Keep internally for deduplication, won't be in final export
    };
  } catch (error) {
    console.error('Error extracting tweet:', error);
    return null;
  }
}

function clearData() {
  allTweets = [];
  capturedTweets.clear();
  saveToStorage();
  updateStats();
}

function saveToStorage() {
  chrome.storage.local.set({
    allTweets: allTweets,
    capturedUrls: Array.from(capturedTweets)
  });
}

function loadFromStorage() {
  chrome.storage.local.get(['allTweets', 'capturedUrls'], (result) => {
    if (result.allTweets) {
      allTweets = result.allTweets;
    }
    if (result.capturedUrls) {
      capturedTweets = new Set(result.capturedUrls);
    }
    updateStats();
  });
}

function exportToJSONL() {
  if (allTweets.length === 0) {
    console.log('No tweets to export');
    return;
  }

  // Create simplified JSONL with only user and text
  const jsonl = allTweets
    .map(tweet => JSON.stringify({ user: tweet.user, text: tweet.text }))
    .join('\n');

  // Create download
  const blob = new Blob([jsonl], { type: 'application/jsonl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `twitlog_auto_${new Date().toISOString().split('T')[0]}_${allTweets.length}tweets.jsonl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showNotification(`Exported ${allTweets.length} tweets!`);
}

// Status bar UI
function showStatusBar() {
  let statusBar = document.getElementById('twitlog-status-bar');
  if (!statusBar) {
    statusBar = document.createElement('div');
    statusBar.id = 'twitlog-status-bar';
    statusBar.innerHTML = `
      <div class="twitlog-status-content">
        <span class="twitlog-status-indicator">🔴 REC</span>
        <span class="twitlog-status-text">Capturing: <strong id="twitlog-count">0</strong> tweets</span>
        <button id="twitlog-stop-btn" class="twitlog-status-btn">Stop & Export</button>
      </div>
    `;
    document.body.appendChild(statusBar);

    document.getElementById('twitlog-stop-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'stop' });
      stopCapture();
    });
  }
  updateStats();
}

function hideStatusBar() {
  const statusBar = document.getElementById('twitlog-status-bar');
  if (statusBar) {
    statusBar.remove();
  }
}

function updateStats() {
  const countElement = document.getElementById('twitlog-count');
  if (countElement) {
    countElement.textContent = allTweets.length;
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'twitlog-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('twitlog-notification-show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('twitlog-notification-show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Load saved data on startup
loadFromStorage();

console.log('TwitLog Auto extension loaded!');
