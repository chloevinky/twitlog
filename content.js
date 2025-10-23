// TwitLog Content Script - Runs on X/Twitter pages
let isOverlayActive = false;
let selectedPosts = [];
let overlayElements = new Map();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleOverlay') {
    toggleOverlay();
    sendResponse({ active: isOverlayActive });
  } else if (request.action === 'getSelectedPosts') {
    sendResponse({ posts: selectedPosts, count: selectedPosts.length });
  } else if (request.action === 'clearSelected') {
    clearAllSelected();
    sendResponse({ success: true });
  }
  return true;
});

function toggleOverlay() {
  isOverlayActive = !isOverlayActive;

  if (isOverlayActive) {
    activateOverlay();
  } else {
    deactivateOverlay();
  }
}

function activateOverlay() {
  // Show floating toolbar
  showToolbar();

  // Add overlay to all posts
  document.addEventListener('mouseover', handlePostHover);
  document.addEventListener('click', handlePostClick, true);

  // Initial scan of posts
  scanAndAttachOverlays();

  // Watch for new posts (infinite scroll)
  startPostObserver();
}

function deactivateOverlay() {
  // Remove toolbar
  const toolbar = document.getElementById('twitlog-toolbar');
  if (toolbar) toolbar.remove();

  // Remove all overlays
  overlayElements.forEach((overlay, post) => {
    overlay.remove();
  });
  overlayElements.clear();

  // Remove event listeners
  document.removeEventListener('mouseover', handlePostHover);
  document.removeEventListener('click', handlePostClick, true);

  // Stop observer
  if (window.twitlogObserver) {
    window.twitlogObserver.disconnect();
  }
}

function showToolbar() {
  let toolbar = document.getElementById('twitlog-toolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'twitlog-toolbar';
    toolbar.innerHTML = `
      <div class="twitlog-toolbar-content">
        <span class="twitlog-logo">📝 TwitLog</span>
        <span class="twitlog-count">Selected: <strong>0</strong></span>
        <button id="twitlog-export" class="twitlog-btn">Export JSONL</button>
        <button id="twitlog-clear" class="twitlog-btn twitlog-btn-secondary">Clear</button>
        <button id="twitlog-close" class="twitlog-btn twitlog-btn-close">✕</button>
      </div>
    `;
    document.body.appendChild(toolbar);

    // Add event listeners
    document.getElementById('twitlog-export').addEventListener('click', exportToJSONL);
    document.getElementById('twitlog-clear').addEventListener('click', clearAllSelected);
    document.getElementById('twitlog-close').addEventListener('click', toggleOverlay);
  }
  updateCounter();
}

function updateCounter() {
  const counter = document.querySelector('.twitlog-count strong');
  if (counter) {
    counter.textContent = selectedPosts.length;
  }
}

function scanAndAttachOverlays() {
  // Find all tweet articles on the page
  const posts = findAllPosts();
  posts.forEach(post => {
    if (!overlayElements.has(post)) {
      attachOverlay(post);
    }
  });
}

function findAllPosts() {
  // X.com uses article elements for tweets
  return Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
}

function attachOverlay(post) {
  const overlay = document.createElement('div');
  overlay.className = 'twitlog-overlay';

  const checkbox = document.createElement('div');
  checkbox.className = 'twitlog-checkbox';
  checkbox.innerHTML = '✓';
  overlay.appendChild(checkbox);

  post.style.position = 'relative';
  post.appendChild(overlay);
  overlayElements.set(post, overlay);

  // Check if this post is already selected
  const postData = extractPostData(post);
  if (selectedPosts.some(p => p.url === postData.url)) {
    overlay.classList.add('twitlog-selected');
  }
}

function handlePostHover(e) {
  const post = e.target.closest('article[data-testid="tweet"]');
  if (post && overlayElements.has(post)) {
    const overlay = overlayElements.get(post);
    overlay.classList.add('twitlog-hover');
  }

  // Remove hover from other posts
  overlayElements.forEach((overlay, p) => {
    if (p !== post) {
      overlay.classList.remove('twitlog-hover');
    }
  });
}

function handlePostClick(e) {
  const post = e.target.closest('article[data-testid="tweet"]');
  if (post && overlayElements.has(post)) {
    // Only handle if clicking on the overlay or checkbox
    if (e.target.closest('.twitlog-overlay, .twitlog-checkbox')) {
      e.preventDefault();
      e.stopPropagation();
      togglePostSelection(post);
    }
  }
}

function togglePostSelection(post) {
  const overlay = overlayElements.get(post);
  const postData = extractPostData(post);

  const index = selectedPosts.findIndex(p => p.url === postData.url);

  if (index >= 0) {
    // Deselect
    selectedPosts.splice(index, 1);
    overlay.classList.remove('twitlog-selected');
  } else {
    // Select
    selectedPosts.push(postData);
    overlay.classList.add('twitlog-selected');
  }

  updateCounter();
  saveToStorage();
}

function extractPostData(post) {
  try {
    // Extract text content
    const textElement = post.querySelector('[data-testid="tweetText"]');
    const text = textElement ? textElement.innerText : '';

    // Extract author
    const authorElement = post.querySelector('[data-testid="User-Name"]');
    const author = authorElement ? authorElement.innerText.split('\n')[0] : '';

    // Extract username
    const usernameElement = post.querySelector('[data-testid="User-Name"] a[href^="/"]');
    const username = usernameElement ? usernameElement.getAttribute('href').substring(1) : '';

    // Extract timestamp
    const timeElement = post.querySelector('time');
    const timestamp = timeElement ? timeElement.getAttribute('datetime') : new Date().toISOString();

    // Extract tweet URL
    const linkElement = post.querySelector('a[href*="/status/"]');
    const url = linkElement ? 'https://x.com' + linkElement.getAttribute('href') : '';

    // Extract metrics (likes, retweets, etc.)
    const metrics = {};
    const replyButton = post.querySelector('[data-testid="reply"]');
    const retweetButton = post.querySelector('[data-testid="retweet"]');
    const likeButton = post.querySelector('[data-testid="like"]');

    if (replyButton) {
      const replyCount = replyButton.getAttribute('aria-label') || '';
      metrics.replies = parseInt(replyCount.match(/\d+/)?.[0] || '0');
    }
    if (retweetButton) {
      const retweetCount = retweetButton.getAttribute('aria-label') || '';
      metrics.retweets = parseInt(retweetCount.match(/\d+/)?.[0] || '0');
    }
    if (likeButton) {
      const likeCount = likeButton.getAttribute('aria-label') || '';
      metrics.likes = parseInt(likeCount.match(/\d+/)?.[0] || '0');
    }

    return {
      text,
      author,
      username,
      timestamp,
      url,
      metrics,
      captured_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting post data:', error);
    return null;
  }
}

function clearAllSelected() {
  selectedPosts = [];
  overlayElements.forEach(overlay => {
    overlay.classList.remove('twitlog-selected');
  });
  updateCounter();
  saveToStorage();
}

function saveToStorage() {
  chrome.storage.local.set({ selectedPosts });
}

function loadFromStorage() {
  chrome.storage.local.get(['selectedPosts'], (result) => {
    if (result.selectedPosts) {
      selectedPosts = result.selectedPosts;
      updateCounter();
    }
  });
}

function exportToJSONL() {
  if (selectedPosts.length === 0) {
    alert('No posts selected. Click on posts to select them first!');
    return;
  }

  // Convert to JSONL format
  const jsonl = selectedPosts.map(post => JSON.stringify(post)).join('\n');

  // Create download
  const blob = new Blob([jsonl], { type: 'application/jsonl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `twitlog_${new Date().toISOString().split('T')[0]}_${selectedPosts.length}posts.jsonl`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show success message
  showNotification(`Exported ${selectedPosts.length} posts to JSONL!`);
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

function startPostObserver() {
  // Watch for new posts being added to the DOM
  const observer = new MutationObserver((mutations) => {
    if (isOverlayActive) {
      scanAndAttachOverlays();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.twitlogObserver = observer;
}

// Load saved posts on startup
loadFromStorage();

console.log('TwitLog extension loaded!');
