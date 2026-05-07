# PII Guard (Obfuscate) - Setup Guide

**Version:** 0.1.0  
**Protection Scope:** All URLs  
**Features:** Client-side PII redaction for all outgoing requests

## What It Does

Automatically redacts sensitive information (emails, phone numbers, SSNs, credit cards) from **all outgoing requests** across every website—not just ChatGPT. Uses obfuscation/tokenization to protect your data.

## Installation (Chrome/Edge)

### Step 1: Enable Developer Mode
1. Open Chrome and go to `chrome://extensions/`
2. Toggle **"Developer mode"** (top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to this folder (`encrypted/`)
3. Select and confirm

You should see "PII Guard (Obfuscate)" in your extensions list with a toggle to enable/disable.

## How It Works

- **Intercepts:** `fetch()`, `XMLHttpRequest`, and `FormData` requests
- **Redacts:** Emails → `[email]`, Phones → `[phone]`, SSN → `[ssn]`, Credit cards → `[card]`
- **Scope:** Runs on **every website** automatically
- **Method:** Regex pattern matching + string replacement

## Configuration

Edit `redact.js` to customize what gets redacted:

```javascript
const PATTERNS = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\b(?:\+?\d[\s-]?){7,}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  // Add more patterns here
};
```

## Testing

1. **Log Mode** (default): Check console for `[PII-Guard] redacted` messages
2. **Try it:** 
   - Open DevTools (F12) → Console
   - Paste test data in any form (won't actually submit)
   - See redaction in console

## Files

- `manifest.json` — Extension metadata
- `page_inject.js` — Page-level injection script
- `redact.js` — Core redaction logic
- `content_script.js` — Content script runner
- `background.js` — Service worker
- `popup.html` — Extension popup UI
- `popup.js` — Popup functionality

## Troubleshooting

**Extension doesn't appear?**
- Make sure Developer Mode is ON
- Refresh the extensions page

**Redaction not working?**
- Check DevTools Console for errors
- Verify patterns in `redact.js`
- Some sites may have additional security restrictions

**Performance issues?**
- The extension runs on all pages—you can add URL exclusions in `manifest.json` under `content_scripts.matches`

## Privacy Notes

- ✅ No data sent anywhere—100% client-side
- ✅ Works offline
- ✅ No external API calls
- ✅ Open source—review the code yourself

## Future Improvements

- [ ] Configurable patterns via popup UI
- [ ] Whitelist/blacklist by domain
- [ ] Mode selector (log/block/rewrite)
- [ ] Custom redaction tokens
