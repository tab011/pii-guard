
# PII Guard (Encrypted) — MV3 Extension

Client-side **tokenization** of PII/CUI (emails, phones, SSN-ish, credit-card-ish, hostnames/FQDNs, IPv4/IPv6, URLs (host-only), usernames/handles, AD/Kerberos UPNs, LDAP uid DNs, Unix home refs, and proper names (field-aware)) **before paste and send**, with **encrypted local mapping** (AES‑GCM) and **passphrase unlock**.

## Features
- **Paste Guard**: sanitize clipboard text when pasting into inputs/textareas/contenteditable.
- **Copy Guard** (optional): sanitize copied/cut text leaving the browser.
- **Send Guard**: sanitize forms, `fetch`, `XMLHttpRequest`, and `FormData` just before they leave the page.
- **URL host** tokenization preserves path/query/fragment so links remain usable.
- **Usernames**: generic (`user_01`), `@handles`, `DOMAIN\user`, `user@REALM` (UPN), `/home/user`, `User alice`, `uid=bob,...`
- **Names**: only sanitized in **name-like fields** (to avoid wrecking prose).
- **Encrypted token mapping**: PBKDF2(200k) → AES‑GCM(256). Mapping stays encrypted at rest (chrome.storage.local).
- **Unlock UI**: passphrase required per session (service worker keeps key in memory until idle/lock).
- **Context menu**: “Mark selection as Name/Hostname/IP/Username”.

## Install
1. Download and unzip (or use the zip provided).
2. Chrome/Edge/Brave → `chrome://extensions` → enable **Developer mode**.
3. **Load unpacked** → select the `pii-guard-encrypted/` folder.
4. Click the extension icon → set a **passphrase** and press **Unlock**.
5. Toggle guards as desired.

## Notes
- Password/file inputs are never altered.
- Per-session unlock: if the service worker goes idle, you may need to unlock again.
- This is a **prototype**: for production, add site allowlists/denylists, thorough tests, and a UI for export/import of the encrypted mapping.
