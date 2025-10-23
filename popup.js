// TwitLog Popup Script

let isActive = false;

const toggleBtn = document.getElementById('toggle-btn');
const exportBtn = document.getElementById('export-btn');
const clearBtn = document.getElementById('clear-btn');
const statusDiv = document.getElementById('status');
const postCountSpan = document.getElementById('post-count');

// Initialize popup
async function init() {
  await updateStats();
  setupListeners();
}

function setupListeners() {
  toggleBtn.addEventListener('click', toggleOverlay);
  exportBtn.addEventListener('click', exportPosts);
  clearBtn.addEventListener('click', clearPosts);
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function toggleOverlay() {
  const tab = await getCurrentTab();

  if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
    alert('Please navigate to X.com or Twitter.com to use this extension!');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      alert('Please refresh the page and try again.');
      return;
    }

    if (response && response.active !== undefined) {
      isActive = response.active;
      updateUI();
    }
  });
}

async function exportPosts() {
  const tab = await getCurrentTab();

  chrome.tabs.sendMessage(tab.id, { action: 'getSelectedPosts' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      return;
    }

    if (response && response.posts) {
      if (response.posts.length === 0) {
        alert('No posts selected. Please select some posts first!');
        return;
      }

      // Convert to JSONL
      const jsonl = response.posts.map(post => JSON.stringify(post)).join('\n');

      // Create download
      const blob = new Blob([jsonl], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url: url,
        filename: `twitlog_${new Date().toISOString().split('T')[0]}_${response.posts.length}posts.jsonl`,
        saveAs: true
      });
    }
  });
}

async function clearPosts() {
  const tab = await getCurrentTab();

  if (confirm('Are you sure you want to clear all selected posts?')) {
    chrome.tabs.sendMessage(tab.id, { action: 'clearSelected' }, async (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError);
        return;
      }

      if (response && response.success) {
        await updateStats();
      }
    });
  }
}

async function updateStats() {
  const tab = await getCurrentTab();

  if (!tab || (!tab.url.includes('twitter.com') && !tab.url.includes('x.com'))) {
    postCountSpan.textContent = '-';
    exportBtn.disabled = true;
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'getSelectedPosts' }, (response) => {
    if (chrome.runtime.lastError) {
      // Content script not loaded yet
      postCountSpan.textContent = '0';
      exportBtn.disabled = true;
      return;
    }

    if (response && response.count !== undefined) {
      postCountSpan.textContent = response.count;
      exportBtn.disabled = response.count === 0;
    }
  });
}

function updateUI() {
  if (isActive) {
    toggleBtn.textContent = 'Deactivate Overlay';
    toggleBtn.classList.remove('btn-primary');
    toggleBtn.classList.add('btn-success');
    statusDiv.textContent = 'Overlay Active';
    statusDiv.classList.remove('inactive');
    statusDiv.classList.add('active');
  } else {
    toggleBtn.textContent = 'Activate Overlay';
    toggleBtn.classList.remove('btn-success');
    toggleBtn.classList.add('btn-primary');
    statusDiv.textContent = 'Overlay Inactive';
    statusDiv.classList.remove('active');
    statusDiv.classList.add('inactive');
  }
}

// Update stats periodically
setInterval(updateStats, 2000);

// Initialize on load
init();
