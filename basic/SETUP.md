# PII Guard (ChatGPT) - Setup Guide

**Version:** Generated from piiguard.sh  
**Protection Scope:** ChatGPT only (`chat.openai.com`, `chatgpt.com`)  
**Features:** Encrypted tokenization for ChatGPT interactions

## What It Does

Redacts PII (emails, phone numbers, SSNs) **only when sending data to ChatGPT**. Leaves all other website traffic untouched.

### Supported Patterns

- **Email:** `user@example.com` → `[email]`
- **Phone:** `(555) 123-4567` → `[phone]`
- **SSN:** `123-45-6789` → `[ssn]`

## Installation (Chrome/Edge)

### Step 1: Enable Developer Mode
1. Open Chrome → `chrome://extensions/`
2. Toggle **"Developer mode"** (top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"**
2. Navigate to this folder (`basic/`)
3. Select and open

You should see "PII Guard (Encrypted): ChatGPT Only" appear in your extensions.

## How It Works

The extension:
1. **Intercepts** fetch and XHR requests
2. **Checks** if the request is going to ChatGPT domains
3. **Redacts** any matching PII patterns in the request body
4. **Forwards** the sanitized request

Only ChatGPT-bound requests are modified—everything else passes through unchanged.

## Configuration

### Change Mode (Advanced)

Edit `page_inject.js` line 63:
```javascript
const MODE = 'log'; // 'log' | 'block' | 'rewrite'
```

- **`log`** (default): Console warning, request still sent
- **`block`**: Stop the request if PII detected
- **`rewrite`**: Replace PII and send sanitized version

### Add More Sites

Edit `page_inject.js` line 64:
```javascript
const HOST_OK = /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/i;
```

Add more domains like:
```javascript
const HOST_OK = /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$|(^|\.)claude\.ai$/i;
```

### Customize Patterns

Edit `page_inject.js` lines 68-71 to add/modify regex patterns:
```javascript
const REDACT = (s) => {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
    .replace(/\b(?:\+?\d[\s-]?){7,}\b/g, '[phone]')
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]')
    // Add custom patterns here
};
```

## Testing

1. Go to ChatGPT (`chat.openai.com`)
2. Open DevTools (F12) → Console tab
3. Type test data in ChatGPT: `My email is test@example.com`
4. Check console—you should see `[PII-Guard] redacted payload`
5. The redacted version is sent to ChatGPT

## Files

- `manifest.json` — Extension metadata (ChatGPT-only permissions)
- `content_script.js` — Injects the page script
- `page_inject.js` — Core redaction logic (runs in page context)
- `background.js` — Service worker
- `popup.html` — Extension popup

## Privacy & Security

✅ **100% client-side** — Nothing leaves your computer  
✅ **No servers** — Works offline  
✅ **No tracking** — No analytics or logging  
✅ **Open source** — Review the code yourself  

## Troubleshooting

**Extension doesn't appear in Chrome?**
- Verify Developer mode is ON
- Try refreshing the page
- Reload the extension (toggle off/on)

**Redaction not triggering?**
- Make sure you're on `chat.openai.com` or `chatgpt.com`
- Check DevTools Console for error messages
- Verify `page_inject.js` is loaded

**Want to see what's being redacted?**
- Open DevTools Console while using ChatGPT
- Look for `[PII-Guard] redacted payload` messages

**Performance issues?**
- This is lightweight—should have minimal impact
- Try reloading the page if it seems slow

## Future Improvements

- [ ] UI popup to toggle redaction on/off
- [ ] Configurable mode selector
- [ ] Custom pattern editor
- [ ] Domain whitelist/blacklist
- [ ] Logging dashboard
