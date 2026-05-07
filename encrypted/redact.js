// Minimal, fast redactors. Adjust as needed.

function isIPv4(ip) {
  return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(ip);
}

function isPrivateIPv4(ip) {
  if (!isIPv4(ip)) return false;
  const [a,b] = ip.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127;
}

// Basic find/replace list
const REDACT_RULES = [
  // emails
  { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, mask: "[REDACTED_EMAIL]" },
  // US phone-like numbers (very permissive)
  { re: /(?<!\d)(?:\+?1[-. ]?)?(?:\(?\d{3}\)?[-. ]?)?\d{3}[-. ]?\d{4}(?!\d)/g, mask: "[REDACTED_PHONE]" },
  // IPv4 public (skip private/loopback)
  { re: /\b((25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3})\b/g, mask: (m) => (isPrivateIPv4(m) ? m : "[REDACTED_IP]") },
  // credit-card-ish 13–19 digits (with separators)
  { re: /\b(?:\d[ -]*?){13,19}\b/g, mask: "[REDACTED_CC]" }
];

// Redact plain strings
function redactString(s) {
  if (typeof s !== "string" || !s) return s;
  let out = s;
  for (const { re, mask } of REDACT_RULES) {
    out = out.replace(re, (m) => (typeof mask === "function" ? mask(m) : mask));
  }
  return out;
}

// Redact JSON bodies (only string fields; preserves shapes)
function redactJSON(value) {
  if (value == null) return value;
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map(redactJSON);
  if (typeof value === "object") {
    const out = Array.isArray(value) ? [] : {};
    for (const k of Object.keys(value)) out[k] = redactJSON(value[k]);
    return out;
  }
  return value;
}

// Exposed to page_inject.js
window.__PII_REDACT__ = { redactString, redactJSON };
