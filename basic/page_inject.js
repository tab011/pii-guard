(() => {
  const MODE = 'log'; // 'log' | 'block' | 'rewrite'
  const HOST_OK = /(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/i;

  const REDACT = (s) => {
    if (typeof s !== 'string') return s;
    return s
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[email]')
      .replace(/\b(?:\+?\d[\s-]?){7,}\b/g, '[phone]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ssn]');
  };

  const isChatgptUrl = (url) => {
    try {
      const u = new URL(url, location.href);
      return HOST_OK.test(u.hostname);
    } catch { return false; }
  };

  const applyPolicyToText = (txt) => {
    const redacted = REDACT(txt);
    if (MODE === 'log' && redacted !== txt)
      console.info('[PII-Guard] redacted payload');
    if (MODE === 'rewrite') return redacted;
    if (MODE === 'block') throw new Error('[PII-Guard] blocked outgoing payload');
    return txt;
  };

  const scrubBody = async (body) => {
    try {
      if (body == null) return body;
      if (body instanceof Blob || body instanceof ArrayBuffer ||
          ArrayBuffer.isView(body) || body instanceof FormData)
        return body;
      if (typeof body === 'string') return applyPolicyToText(body);
      if (typeof body === 'object') return applyPolicyToText(JSON.stringify(body));
      return body;
    } catch (e) {
      console.warn('[PII-Guard] scrubBody failed', e);
      return body;
    }
  };

  // ---- fetch ----
  const _fetch = window.fetch;
  window.fetch = async function(input, init) {
    try {
      const url = input instanceof Request ? input.url : input;
      if (!isChatgptUrl(url)) return _fetch.apply(this, arguments);
      if (init && 'body' in init) {
        const newBody = await scrubBody(init.body);
        const newInit = Object.assign({}, init, { body: newBody });
        return _fetch.call(this, input, newInit);
      }
    } catch (e) {
      console.warn('[PII-Guard] fetch wrapper failed', e);
    }
    return _fetch.apply(this, arguments);
  };

  // ---- XMLHttpRequest ----
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    try { this.__pii_guard_target = isChatgptUrl(url); } catch {}
    return _open.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    try {
      if (!this.__pii_guard_target) return _send.call(this, body);
      if (body instanceof Blob || body instanceof ArrayBuffer ||
          ArrayBuffer.isView(body) || body instanceof FormData)
        return _send.call(this, body);
      if (typeof body === 'string')
        return _send.call(this, applyPolicyToText(body));
      if (typeof body === 'object' && body != null)
        return _send.call(this, applyPolicyToText(JSON.stringify(body)));
    } catch (e) {
      console.warn('[PII-Guard] XHR wrapper failed', e);
    }
    return _send.call(this, body);
  };

  console.info('[PII-Guard] page_inject loaded (mode=' + MODE + ')');
})();
