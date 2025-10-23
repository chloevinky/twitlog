// TwitLog Auto Popup Script

const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const exportBtn = document.getElementById('export-btn');
const clearBtn = document.getElementById('clear-btn');
const tweetCountSpan = document.getElementById('tweet-count');
const statusBadge = document.getElementById('status-badge');

// Initialize
init();

async function init() {
  await updateUI();
  setupListeners();

  // Update UI every second
  setInterval(updateUI, 1000);
}

function setupListeners() {
  startBtn.addEventListener('click', startCapture);
  stopBtn.addEventListener('click', stopCapture);
  exportBtn.addEventListener('click', exportData);
  clearBtn.addEventListener('click', clearData);
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function startCapture() {
  const tab = await getCurrentTab();

  if (!tab.url.includes('twitter.com') && !tab.url.includes('x.com')) {
    alert('Please navigate to X.com or Twitter.com first!');
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'start' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      alert('Please refresh the page and try again.');
      return;
    }

    if (response && response.success) {
      updateUI();
    }
  });
}

async function stopCapture() {
  const tab = await getCurrentTab();

  chrome.tabs.sendMessage(tab.id, { action: 'stop' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      return;
    }

    if (response && response.success) {
      updateUI();
    }
  });
}

async function exportData() {
  const tab = await getCurrentTab();

  chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      return;
    }

    if (response && response.tweets && response.tweets.length > 0) {
      // Create simplified JSONL with only user and text
      const jsonl = response.tweets
        .map(tweet => JSON.stringify({ user: tweet.user, text: tweet.text }))
        .join('\n');

      // Create download
      const blob = new Blob([jsonl], { type: 'application/jsonl' });
      const url = URL.createObjectURL(blob);

      chrome.downloads.download({
        url: url,
        filename: `twitlog_auto_${new Date().toISOString().split('T')[0]}_${response.tweets.length}tweets.jsonl`,
        saveAs: true
      });
    } else {
      alert('No tweets to export!');
    }
  });
}

async function clearData() {
  if (!confirm('Clear all captured tweets?')) {
    return;
  }

  const tab = await getCurrentTab();

  chrome.tabs.sendMessage(tab.id, { action: 'clear' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
      return;
    }

    if (response && response.success) {
      updateUI();
    }
  });
}

async function updateUI() {
  const tab = await getCurrentTab();

  if (!tab || (!tab.url.includes('twitter.com') && !tab.url.includes('x.com'))) {
    tweetCountSpan.textContent = '-';
    exportBtn.disabled = true;
    statusBadge.textContent = '⚫ Not on X.com';
    statusBadge.className = 'status-badge status-stopped';
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
    if (chrome.runtime.lastError) {
      tweetCountSpan.textContent = '0';
      exportBtn.disabled = true;
      statusBadge.textContent = '⚫ Stopped';
      statusBadge.className = 'status-badge status-stopped';
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      return;
    }

    if (response) {
      tweetCountSpan.textContent = response.count || 0;
      exportBtn.disabled = response.count === 0;

      if (response.running) {
        statusBadge.textContent = '🔴 Recording';
        statusBadge.className = 'status-badge status-running';
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
      } else {
        statusBadge.textContent = '⚫ Stopped';
        statusBadge.className = 'status-badge status-stopped';
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';
      }
    }
  });
}
