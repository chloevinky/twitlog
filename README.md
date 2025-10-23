# TwitLog - X/Twitter Post Capturer

A browser extension that makes it easy to capture and save X/Twitter posts for LLM training data. TwitLog provides an intuitive overlay interface that lets you select posts while browsing, then export them to properly formatted JSONL files.

## Features

- **Visual Overlay Selection**: Hover over any post to see a selection overlay, click to select/deselect
- **Real-time Tracking**: See how many posts you've selected with a floating toolbar
- **Rich Data Capture**: Extracts post text, author info, timestamps, engagement metrics, and URLs
- **JSONL Export**: One-click export to properly formatted JSONL files ready for LLM training
- **Persistent Storage**: Your selections are saved even if you close the tab or browser
- **Infinite Scroll Support**: Automatically detects new posts as you scroll

## Installation

### Chrome/Edge

1. Download or clone this repository
2. Open Chrome/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `twitlog` directory
6. The extension icon should appear in your toolbar

### Firefox

1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `twitlog` directory
5. The extension will be active for this session

## Usage

### Quick Start

1. Navigate to [x.com](https://x.com) or [twitter.com](https://twitter.com)
2. Click the TwitLog extension icon in your browser toolbar
3. Click **"Activate Overlay"** in the popup
4. Browse X/Twitter normally - you'll see a floating toolbar appear
5. Hover over any post to see the selection overlay
6. Click on posts to select them (they'll turn green when selected)
7. Click **"Export JSONL"** in the toolbar when you're done
8. Your posts will be downloaded as a JSONL file

### Interface Guide

#### Extension Popup
- **Activate Overlay**: Toggles the selection interface on/off
- **Export to JSONL**: Downloads selected posts (also available in toolbar)
- **Clear Selection**: Removes all selected posts
- **Posts Selected**: Shows current selection count

#### On-Page Toolbar
- **Selected Count**: Real-time count of selected posts
- **Export JSONL**: Download your selected posts
- **Clear**: Remove all selections
- **✕**: Close the overlay and return to normal browsing

## Data Format

Each post is exported as a JSON object with the following structure:

```json
{
  "text": "The actual tweet text content",
  "author": "Display Name",
  "username": "username",
  "timestamp": "2024-01-23T10:30:00.000Z",
  "url": "https://x.com/username/status/1234567890",
  "metrics": {
    "replies": 42,
    "retweets": 128,
    "likes": 567
  },
  "captured_at": "2024-01-23T15:45:00.000Z"
}
```

### JSONL Format

Posts are exported in JSONL (JSON Lines) format, where each line is a complete JSON object. This format is ideal for:
- LLM training data
- Batch processing
- Streaming data pipelines
- Easy line-by-line parsing

Example JSONL file:
```
{"text":"First post...","author":"User1",...}
{"text":"Second post...","author":"User2",...}
{"text":"Third post...","author":"User3",...}
```

## Use Cases

- **LLM Training**: Curate high-quality training data from specific topics or accounts
- **Research**: Collect posts for sentiment analysis, trend research, or social media studies
- **Content Curation**: Save interesting posts for later reference or content creation
- **Dataset Building**: Build custom datasets for machine learning projects

## Privacy & Security

- **Local Storage Only**: All data is stored locally in your browser
- **No Analytics**: No tracking or analytics are collected
- **No External Servers**: No data is sent to external servers
- **Open Source**: All code is available for review

## Development

### Project Structure

```
twitlog/
├── manifest.json          # Extension manifest
├── content.js            # Main content script (runs on X.com)
├── overlay.css           # Overlay styling
├── popup.html           # Extension popup UI
├── popup.js             # Popup functionality
├── background.js        # Background service worker
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── generate_icons.py    # Icon generation script
└── README.md           # This file
```

### Building Icons

To regenerate the icons:

```bash
python3 generate_icons.py
```

### Testing

1. Load the extension in developer mode
2. Navigate to X.com
3. Test the overlay activation and post selection
4. Verify JSONL export format and content
5. Test with infinite scroll and dynamic content

## Compatibility

- **Chrome**: Version 88+ (Manifest V3)
- **Edge**: Version 88+ (Manifest V3)
- **Firefox**: Version 109+ (Manifest V3 support)
- **Brave**: Version 1.34+ (Manifest V3)

## Known Limitations

- Only works on x.com and twitter.com domains
- Requires page refresh if extension is installed/updated while on X.com
- Media attachments (images/videos) are not captured, only text content
- Replies/threads are captured as individual posts, not as threaded conversations

## Troubleshooting

### Overlay not appearing
- Refresh the page after activating the overlay
- Make sure you're on x.com or twitter.com
- Check that the extension is enabled in your browser

### Posts not being selected
- Make sure the overlay is activated
- Try clicking directly on the blue overlay area
- Refresh the page and try again

### Export not working
- Make sure you have at least one post selected
- Check your browser's download settings
- Try using the export button in the popup instead of the toolbar

## Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## License

MIT License - feel free to use this for any purpose, commercial or non-commercial.

## Disclaimer

This tool is for educational and research purposes. When collecting data from X/Twitter:
- Respect user privacy
- Follow X/Twitter's Terms of Service
- Consider data usage rights and attribution
- Be mindful of sensitive or personal information

---

**Made for LLM training data collection**

For questions or issues, please open an issue on GitHub.
