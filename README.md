# PII Guard

Client-side privacy protection extensions for Chrome/Edge. Automatically redacts personally identifiable information (emails, phone numbers, SSNs) from outgoing requests.

**Status:** Community extensions (not Chrome Web Store blessed)  
**Security:** 100% client-side, no servers, no tracking  
**License:** MIT

## 🛡️ Three Versions

| Version | Scope | Best For | Status |
|---------|-------|----------|--------|
| **[encrypted/](encrypted/)** | All URLs | Complete privacy protection | ⭐ Latest & Recommended |
| **[basic/](basic/)** | ChatGPT only | Focused ChatGPT protection | Stable |
| **[v0.11.0/](v0.11.0/)** | Variable | Reference/testing | Legacy |

### Quick Comparison

```
Encrypted (Recommended)
├─ Protects: All websites
├─ Features: Full obfuscation, configurable patterns
├─ Version: 0.1.0
└─ Setup: See encrypted/SETUP.md

Basic (ChatGPT-Focused)
├─ Protects: ChatGPT only
├─ Features: Simple redaction, low overhead
├─ Version: Generated
└─ Setup: See basic/SETUP.md

v0.11.0 (Legacy)
├─ Protects: Limited/configurable
├─ Features: Early implementation
├─ Version: 0.11.0
└─ Setup: See v0.11.0/SETUP.md
```

## 🚀 Quick Start

1. **Choose a version** (start with `encrypted/` if unsure)
2. Open Chrome → `chrome://extensions/`
3. Toggle **"Developer mode"** (top-right)
4. Click **"Load unpacked"**
5. Select the version folder
6. ✅ Extension is now active

**See the SETUP.md in your chosen version folder for detailed instructions.**

## What Gets Redacted

All versions detect and redact:
- 📧 **Emails:** `user@example.com` → `[email]`
- 📱 **Phone numbers:** `(555) 123-4567` → `[phone]`
- 🆔 **SSN:** `123-45-6789` → `[ssn]`
- 💳 **Credit cards:** (encrypted version) → `[card]`

## How It Works

```
Your Data
   ↓
[Browser Request]
   ↓
[PII Guard Extension]
   ├─ Detects patterns
   ├─ Redacts sensitive data
   └─ Forwards sanitized request
   ↓
[Website/API]
(Receives redacted version)
```

## 🔒 Privacy Guarantees

- ✅ **Client-side only** — No data leaves your computer
- ✅ **Offline** — Works without internet
- ✅ **No servers** — No external calls
- ✅ **No tracking** — No analytics
- ✅ **Open source** — Read the code yourself

## 📋 Installation Requirements

- Chrome, Edge, or Chromium-based browser
- Developer Mode enabled
- No additional permissions needed

## 🛠️ Configuration

Each version can be customized:
- **Redaction patterns** — Add/modify regex patterns
- **Protected domains** — Choose which sites get protection
- **Redaction mode** — Log, block, or rewrite requests

See your version's SETUP.md for specific instructions.

## ⚠️ Not a Blessed Extension

These are **not** in the Chrome Web Store because:
- They're developer-focused tools
- They modify network requests
- We wanted to keep them simple and open

You load them in **Developer Mode** as "unpacked extensions"—this is safe and common for development tools.

## 🧪 Testing Your Extension

1. **Open DevTools** (F12 on the page you're testing)
2. **Go to Console tab**
3. **Look for `[PII-Guard]` messages**
4. **Try submitting form data** with PII to see it redacted

Example:
```
Page: "My email is test@example.com and my phone is (555) 123-4567"
Console output: "[PII-Guard] redacted payload"
Sent to server: "My email is [email] and my phone is [phone]"
```

## 📚 Version-Specific Docs

- **[encrypted/SETUP.md](encrypted/SETUP.md)** — Full protection guide
- **[basic/SETUP.md](basic/SETUP.md)** — ChatGPT-focused setup
- **[v0.11.0/SETUP.md](v0.11.0/SETUP.md)** — Legacy version

## 🔧 Customization Examples

### Add a new redaction pattern (Encrypted version)

Edit `encrypted/redact.js`:
```javascript
const PATTERNS = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  phone: /\b(?:\+?\d[\s-]?){7,}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  customData: /YOUR_PATTERN_HERE/gi,  // ← Add custom pattern
};
```

### Change which sites are protected (Basic version)

Edit `basic/page_inject.js` line 64:
```javascript
// Only protect ChatGPT (default)
const HOST_OK = /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/i;

// Or add more sites:
const HOST_OK = /(^|\.)chatgpt\.com$|(^|\.)claude\.ai$|(^|\.)bard\.google\.com$/i;
```

### Change the redaction mode (Basic version)

Edit `basic/page_inject.js` line 63:
```javascript
const MODE = 'log';    // Just log (default)
// const MODE = 'block';  // Block requests with PII
// const MODE = 'rewrite'; // Send sanitized version
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension doesn't appear | Check Developer Mode is ON in `chrome://extensions/` |
| Redaction not working | Check console for errors (F12), reload extension |
| Not protecting a domain | Verify the domain is in the pattern (see SETUP.md) |
| Performance issues | The extensions are lightweight; try reloading the page |

## 💡 Future Roadmap

- [ ] Chrome Web Store official release
- [ ] Popup UI for settings
- [ ] Domain whitelist/blacklist
- [ ] Custom pattern editor
- [ ] Logging dashboard
- [ ] Firefox support

## 📝 License

MIT License — See LICENSE file for details

## 🤝 Contributing

Improvements welcome! This is a personal privacy tool that you can fork and customize.

## ⚖️ Legal Notes

- These extensions are **for your own use**
- They **do not bypass security** or violate ToS (they just sanitize your own input)
- Always read the code before running extensions
- Use at your own risk

---

**Created:** October 2025  
**Last Updated:** May 2026  
**Maintained by:** Baker  
**Co-created with:** Claude AI
