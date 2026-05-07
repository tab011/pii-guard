// page_inject.js
(function () {
  if (window.__PII_GUARD_INJECTED) return;
  window.__PII_GUARD_INJECTED = true;

  // Simple PII replacement functions (tweak patterns as needed)
  const RE_EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  const RE_US_PHONE = /(\+?1[\s-.]?)?\(?\d{3}\)?[\s-.]?\d{3}[\s-.]?\d{4}/g;
  const RE_SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
  // very simple address-ish match: "Number + word + (St|Street|Ave|Avenue|Rd|Road|Terrace|Blvd)"
  const RE_SIMPLE_ADDR = /\b\d{1,6}\s+[A-Za-z0-9 .,#'\-]{2,60}\b(?:St(?:reet)?|Ave(?:nue)?|Rd|Road|Terrace|Blvd|Lane|Ln)\b/gi;

  function maskPII(text) {
    if (!text || typeof text !== 'string') return text;
    // order matters (avoid double masking)
    text = text.replace(RE_EMAIL, match => `__PII::email::${hashToken(match)}__`);
    text = text.replace(RE_SSN, match => `__PII::ssn::${hashToken(match)}__`);
    text = text.replace(RE_US_PHONE, match => `__PII::phone::${hashToken(match)}__`);
    text = text.replace(RE_SIMPLE_ADDR, match => `__PII::addr::${hashToken(match)}__`);
    return text;
  }

  // lightweight token generator (not crypto — replace with proper hashing if desired)
  function hashToken(s) {
    // simple deterministic hash to keep tokens short but reversible if you keep mapping locally
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  // --- Override fetch ---
  const origFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    try {
      // Build a Request object we can inspect
      const req = new Request(input, init);
      const contentType = req.headers.get('content-type') || '';

      // Only attempt to modify text/json types — don't try to read binary
      if (req.method && req.method.toUpperCase() !== 'GET' && /json|text|plain|application\/x-www-form-urlencoded/.test(contentType)) {
        let bodyText = null;
        // If init && init.body present, try to read that first
        if (init && init.body) {
          if (typeof init.body === 'string') {
            bodyText = init.body;
          } else if (init.body instanceof FormData) {
            // Convert FormData to string to search/replace values (note: recreating FormData after)
            const fd = init.body;
            const pairs = [];
            for (const [k, v] of fd.entries()) {
              // ignore files (Blobs)
              if (v instanceof Blob) {
                pairs.push({ k, v }); // keep as-is
              } else {
                pairs.push({ k, v: maskPII(String(v)) });
              }
            }
            const newFd = new FormData();
            for (const p of pairs) newFd.append(p.k, p.v);
            const newInit = Object.assign({}, init, { body: newFd });
            return origFetch(input, newInit);
          } else if (init.body instanceof Blob) {
            // skip binary bodies
            return origFetch(input, init);
          }
        } else {
          // try to clone request and read text
          try {
            const clone = req.clone();
            bodyText = await clone.text();
          } catch (e) {
            bodyText = null;
          }
        }

        if (typeof bodyText === 'string' && bodyText.length > 0) {
          const masked = maskPII(bodyText);
          // create a new Request with masked body and original options
          const newHeaders = new Headers(req.headers);
          // ensure content-length not stale (browser will handle it)
          const newReq = new Request(req.url, {
            method: req.method,
            headers: newHeaders,
            body: masked,
            mode: req.mode,
            credentials: req.credentials,
            cache: req.cache,
            redirect: req.redirect,
            referrer: req.referrer,
            referrerPolicy: req.referrerPolicy,
            integrity: req.integrity,
            keepalive: req.keepalive,
            signal: req.signal,
          });
          return origFetch(newReq);
        }
      }
    } catch (err) {
      // don't break page: if our sanitizer fails, fall back to original fetch
      console.error('PII Guard fetch wrapper error', err);
    }
    return origFetch(input, init);
  };

  // --- Override XMLHttpRequest.send ---
  const origXhrSend = XMLHttpRequest.prototype.send;
  const origXhrOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this.__pii_guard_method = method ? method.toUpperCase() : 'GET';
    this.__pii_guard_url = url;
    return origXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    try {
      if (this.__pii_guard_method !== 'GET' && typeof body === 'string' && body.length > 0) {
        const contentType = this.getRequestHeader ? this.getRequestHeader('Content-Type') : '';
        if (!contentType || /json|text|plain|application\/x-www-form-urlencoded/.test(contentType)) {
          const masked = maskPII(body);
          return origXhrSend.call(this, masked);
        }
      } else if (body instanceof FormData) {
        // rebuild FormData with masked string fields; keep Blobs as-is
        const fd = body;
        const newFd = new FormData();
        for (const [k, v] of fd.entries()) {
          if (v instanceof Blob) newFd.append(k, v);
          else newFd.append(k, maskPII(String(v)));
        }
        return origXhrSend.call(this, newFd);
      }
    } catch (err) {
      console.error('PII Guard XHR wrapper error', err);
    }
    return origXhrSend.call(this, body);
  };

  console.log('[PII Guard] page_inject active — outgoing requests will be scanned for PII.');
})();
