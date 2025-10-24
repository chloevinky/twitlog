# TwitLog Auto - Automatic X/Twitter Scraper

A fully automated browser extension that scrolls through X/Twitter with human-like behavior and captures all tweets in a simplified JSONL format perfect for LLM training.

## Features

- **Automatic Scrolling**: Human-like scrolling with variable speed and random pauses
- **Zero Manual Work**: Just click start and let it run
- **Simplified Format**: Exports only `user` and `text` fields
- **Duplicate Prevention**: Automatically deduplicates tweets by URL
- **Real-time Counter**: See tweets captured in real-time with a status bar
- **Auto-Export**: Automatically exports when you stop capturing
- **Persistent Storage**: Data saved even if you close the tab

## Installation

### Chrome/Edge/Brave

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `twitlog` directory
6. The extension icon should appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `twitlog` directory

## Usage

### Quick Start

1. Navigate to [x.com](https://x.com) or [twitter.com](https://twitter.com)
2. Click the TwitLog Auto extension icon
3. Click **"Start Auto-Capture"**
4. Watch the extension automatically:
   - Scroll down the page with human-like behavior
   - Capture all tweets it encounters
   - Show real-time count in the status bar
5. Click **"Stop & Export"** when done
6. Your tweets will be automatically downloaded as JSONL

### Human-like Scrolling

The extension mimics natural human browsing behavior:
- **Variable scroll distance**: 300-800px per scroll
- **Random pauses**: 800-2500ms between scrolls
- **"Reading" pauses**: 15% chance of 3-second pause
- **Smooth scrolling**: Natural scroll animation
- **Bottom detection**: Scrolls back up when reaching the bottom

### Status Bar

While running, you'll see a status bar at the top of the page showing:
- 🔴 REC indicator (with pulsing animation)
- Real-time tweet count
- "Stop & Export" button

## Data Format

Each tweet is exported with only two fields for simplicity:

```json
{"user":"username","text":"The tweet text content"}
{"user":"another_user","text":"Another tweet"}
{"user":"someone","text":"Yet another tweet"}
```

### Why This Format?

- **Minimal**: Only essential data for LLM training
- **Clean**: No metadata, timestamps, or engagement metrics
- **Standard**: JSONL format (one JSON object per line)
- **Efficient**: Smaller file sizes, faster processing

## Configuration

You can adjust the scroll behavior by editing `content.js`:

```javascript
const SCROLL_CONFIG = {
  minScrollAmount: 300,        // Minimum pixels per scroll
  maxScrollAmount: 800,        // Maximum pixels per scroll
  minPauseDuration: 800,       // Minimum pause (ms)
  maxPauseDuration: 2500,      // Maximum pause (ms)
  readPauseDuration: 3000,     // "Reading" pause (ms)
  readPauseChance: 0.15,       // Chance of reading pause (15%)
  smoothScrollDuration: 600    // Scroll animation time (ms)
};
```

## Use Cases

- **LLM Training**: Collect domain-specific training data
- **Research**: Gather tweets for analysis or studies
- **Dataset Building**: Create custom datasets for ML projects
- **Content Archival**: Save tweets from specific timelines or topics

## Converting to ChatGPT Fine-tuning Format

After capturing tweets, you can convert them to OpenAI ChatGPT fine-tuning format and optionally upload to Hugging Face:

```bash
cd tools
pip install -r requirements.txt

# Convert only
python convert_to_chatgpt.py ../my_tweets.jsonl -o training_data.jsonl

# Convert and upload to Hugging Face
python convert_to_chatgpt.py ../my_tweets.jsonl \
  --hf-token YOUR_HF_TOKEN \
  --hf-repo username/tweet-dataset
```

The conversion tool:
- Converts to OpenAI's fine-tuning format with system/user/assistant messages
- Validates output for ChatGPT compatibility
- Optionally uploads to Hugging Face datasets
- Supports custom system prompts

See [tools/README.md](tools/README.md) for detailed usage instructions.

## Tips for Best Results

1. **Navigate to specific feeds**: Go to a user's profile, a hashtag, or search results before starting
2. **Let it run**: The longer it runs, the more tweets you'll capture
3. **Monitor the counter**: Watch the real-time count to gauge progress
4. **Don't interact**: Let the extension scroll automatically - manual scrolling may interfere
5. **Export regularly**: Stop and restart to export in batches if capturing large amounts

## Project Structure

```
twitlog/
├── manifest.json              # Extension configuration
├── content.js                 # Auto-scroll and capture logic
├── styles.css                 # Status bar and notification styles
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup controls
├── background.js              # Background service worker
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tools/                     # Data processing tools
│   ├── convert_to_chatgpt.py # Convert to ChatGPT format
│   ├── requirements.txt       # Python dependencies
│   ├── sample_tweets.jsonl    # Sample data
│   └── README.md             # Tools documentation
└── README.md                  # This file
```

## Privacy & Ethics

- **Local Only**: All data stored locally in your browser
- **No Tracking**: No analytics or external servers
- **Open Source**: All code is reviewable
- **Respect ToS**: Ensure compliance with X/Twitter's Terms of Service
- **Rate Limiting**: Human-like scrolling helps avoid rate limits

## Troubleshooting

### Extension not scrolling
- Refresh the page and try again
- Make sure you're on x.com or twitter.com
- Check that the page has finished loading

### Not capturing tweets
- Ensure tweets are visible on screen
- Check browser console for errors
- Try refreshing and restarting

### Export not working
- Make sure at least one tweet was captured
- Check browser download permissions
- Try the "Export JSONL" button in the popup

### Captured too many duplicates
- Duplicates are automatically filtered by tweet URL
- If seeing duplicates, it may be retweets with same text

## Known Limitations

- Only captures tweets with text content (skips media-only posts)
- Cannot capture protected/private accounts
- May miss tweets if scrolling is too fast (adjust config)
- Does not preserve thread structure

## Compatibility

- **Chrome**: Version 88+
- **Edge**: Version 88+
- **Brave**: Version 1.34+
- **Firefox**: Version 109+

All browsers must support Manifest V3.

## License

MIT License - Use freely for any purpose, commercial or non-commercial.

## Disclaimer

This tool is for educational and research purposes. When collecting data:
- Follow X/Twitter's Terms of Service
- Respect user privacy and data rights
- Consider ethical implications of data collection
- Be transparent about how data will be used

---

**Built for automated LLM training data collection**

For issues or questions, open an issue on GitHub.
