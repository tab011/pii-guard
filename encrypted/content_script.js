// content_script.js — bridges page_inject <-> lightweight token store in page
// IMPORTANT: no chrome.* APIs in the sanitize/rehydrate path (avoids "Extension context invalidated")

(function () {
  // ---- tiny session-scoped store in page context
  const NS = "__pii_guard_v1__";

  function getMap() {
    try {
      const raw = sessionStorage.getItem(NS);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  function setMap(map) {
    try {
      sessionStorage.setItem(NS, JSON.stringify(map));
    } catch {}
  }
  function remember(original) {
    const map = getMap();
    const hash = h(original);
    map[hash] = original;
    setMap(map);
    return hash;
  }
  function lookup(hash) {
    const map = getMap();
    return map[hash] || null;
  }

  // FNV-1a hash matching page_inject.js
  function h(str) {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  // ----------------- token helpers
  function tokenFor(type, value) {
    // NO chrome.* calls here!
    const hash = remember(value);
    return `__PII::${type}::${hash}__`;
  }

  // Regex pass mirrors page_inject.sanitizeSync (keep in sync)
  function sanitize(str) {
    if (typeof str !== "string" || !str) return str;

    // IPv4
    str = str.replace(
      /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
      (m) => tokenFor("ipv4", m)
    );

    // IPv6
    str = str.replace(
      /\b(?:(?:[A-F0-9]{1,4}:){2,7}[A-F0-9]{0,4}|::(?:[A-F0-9]{1,4}:){0,6}[A-F0-9]{0,4})\b/gi,
      (m) => tokenFor("ipv6", m)
    );

    // Hostnames / FQDNs
    str = str.replace(
      /\b(?=.{1,253}\b)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi,
      (m) => tokenFor("hostname", m)
    );

    // Emails
    str = str.replace(
      /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
      (m) => tokenFor("email", m)
    );

    // Phone numbers (US-ish)
    str = str.replace(
      /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      (m) => tokenFor("phone", m)
    );

    // SSN (Social Security Number)
    str = str.replace(
      /\b\d{3}-\d{2}-\d{4}\b/g,
      (m) => tokenFor("ssn", m)
    );

    // Simple address pattern
    str = str.replace(
      /\b\d{1,6}\s+[A-Za-z0-9 .,#'\-]{2,60}\b(?:St(?:reet)?|Ave(?:nue)?|Rd|Road|Terrace|Blvd|Lane|Ln)\b/gi,
      (m) => tokenFor("addr", m)
    );

    // Windows DOMAIN\user
    str = str.replace(
      /\b([A-Z0-9][A-Z0-9.-]{0,14})\\([A-Za-z0-9._-]{1,20})\b/g,
      (m) => tokenFor("win_dom_user", m)
    );

    // @handles (e.g. GitHub/Twitter-ish)
    str = str.replace(
      /(^|[^\w])@([A-Za-z0-9_\.]{2,32})\b/g,
      (full, pre, handle) => `${pre}${tokenFor("handle", "@" + handle)}`
    );

    return str;
  }


  // ----------------- bridge page <-> content script
  window.addEventListener("message", (ev) => {
    const data = ev.data;
    if (ev.source !== window || !data || data.__piiGuard !== true) return;

    const { op, id, payload } = data;

    try {
      if (op === "sanitize") {
        const out = sanitize(payload);
        window.postMessage({ __piiGuard: true, op: "sanitizeResp", id, payload: out }, "*");
      } else if (op === "rehydrate") {
        const out = rehydrate(payload);
        window.postMessage({ __piiGuard: true, op: "rehydrateResp", id, payload: out }, "*");
      }
    } catch (e) {
      // Fail closed: if anything goes wrong, return original payload so we don't break the page
      window.postMessage({ __piiGuard: true, op: op + "Resp", id, payload }, "*");
    }
  }, false);

  // Optional: paste/copy guards for ChatGPT textareas only (no chrome.* API)
  // Runs entirely in-page, unaffected by extension worker lifecycle.
  function isChatGPTEditable(t) {
    if (!t) return false;
    const tag = (t.tagName || "").toLowerCase();
    return tag === "textarea" || (t.isContentEditable && t.closest('[contenteditable="true"]'));
  }

  document.addEventListener("paste", (e) => {
    const t = document.activeElement;
    if (!isChatGPTEditable(t)) return;

    const clip = e.clipboardData && e.clipboardData.getData("text/plain");
    if (!clip) return;

    const sanitized = sanitize(clip);
    if (sanitized !== clip) {
      e.preventDefault();
      // insert at caret
      if (t.tagName === "TEXTAREA") {
        const ta = t;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = ta.value.slice(0, start) + sanitized + ta.value.slice(end);
        ta.value = next;
        const pos = start + sanitized.length;
        ta.selectionStart = ta.selectionEnd = pos;
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        document.execCommand("insertText", false, sanitized);
      }
    }
  }, true);
})();
