# PII Guard (Tokenize + Paste-out Rehydrate)
Client-side redaction of hostnames, IPv4, emails, and usernames like ab12345; rehydrate on Copy.
## How to use
1. Load this folder as an unpacked extension in Chrome.
2. Type something like: `name.example.com 10.0.0.7 alice.smith@company.org aj12345`
3. Press Enter or Send → It will redact.
4. Copy the text from the page → It will rehydrate (originals restored on clipboard).