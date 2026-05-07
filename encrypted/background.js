
// background.js — MV3 service worker
// Encrypted token mapping using crypto.subtle (PBKDF2 + AES-GCM).
// Stores encrypted entries in chrome.storage.local as { mapping: { token: {iv, ct} }, salt }

let state = {
  unlocked: false,
  key: null,          // CryptoKey (AES-GCM), memory-only while unlocked
  salt: null          // Uint8Array
};

const DEFAULT_SETTINGS = {
  pasteGuard: true,
  copyGuard: false,
  sendGuard: true
};

async function getSalt() {
  const { salt } = await chrome.storage.local.get("salt");
  if (salt) return base64ToBytes(salt);
  // Create new salt
  const s = crypto.getRandomValues(new Uint8Array(16));
  await chrome.storage.local.set({ salt: bytesToBase64(s) });
  return s;
}

async function deriveKey(passphrase) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  const salt = await getSalt();
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt","decrypt"]
  );
  state.key = key;
  state.unlocked = true;
  state.salt = salt;
  return true;
}

function lock() {
  state.key = null;
  state.unlocked = false;
}

async function encryptString(plain) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    state.key,
    enc.encode(plain)
  );
  return { iv: bytesToBase64(iv), ct: bytesToBase64(new Uint8Array(ct)) };
}

async function decryptString(iv_b64, ct_b64) {
  const iv = base64ToBytes(iv_b64);
  const ct = base64ToBytes(ct_b64);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, state.key, ct);
  const dec = new TextDecoder();
  return dec.decode(pt);
}

async function saveMappings(entries) {
  // entries: array of {token, value}
  const store = (await chrome.storage.local.get("mapping")).mapping || {};
  for (const {token, value} of entries) {
    const enc = await encryptString(value);
    store[token] = enc;
  }
  await chrome.storage.local.set({ mapping: store });
  return true;
}

async function lookupTokens(tokens) {
  const store = (await chrome.storage.local.get("mapping")).mapping || {};
  const out = {};
  for (const t of tokens) {
    const rec = store[t];
    if (!rec) continue;
    try {
      const val = await decryptString(rec.iv, rec.ct);
      out[t] = val;
    } catch (e) {
      // ignore decrypt errors
    }
  }
  return out;
}

// Util: base64 <-> bytes
function bytesToBase64(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function base64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["settings","mapping","salt"]);
  if (!data.settings) await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  if (!data.mapping) await chrome.storage.local.set({ mapping: {} });
  if (!data.salt) await chrome.storage.local.set({ salt: bytesToBase64(crypto.getRandomValues(new Uint8Array(16))) });
  // context menus
  chrome.contextMenus.create({ id: "markName", title: "PII Guard: Mark Selection as Name", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "markHost", title: "PII Guard: Mark Selection as Hostname/IP", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "markUser", title: "PII Guard: Mark Selection as Username", contexts: ["selection"] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id || !info.selectionText) return;
  let cat = "name";
  if (info.menuItemId === "markHost") cat = "host";
  if (info.menuItemId === "markUser") cat = "username";
  chrome.tabs.sendMessage(tab.id, { type: "manualTokenize", cat, text: info.selectionText });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === "getSettings") {
        const { settings } = await chrome.storage.local.get("settings");
        sendResponse({ settings });
        return;
      }
      if (msg.type === "setSettings") {
        await chrome.storage.local.set({ settings: msg.settings });
        sendResponse({ ok: true });
        return;
      }
      if (msg.type === "unlock") {
        await deriveKey(msg.passphrase);
        sendResponse({ ok: true, unlocked: true });
        return;
      }
      if (msg.type === "lock") {
        lock();
        sendResponse({ ok: true, unlocked: false });
        return;
      }
      if (msg.type === "status") {
        sendResponse({ unlocked: state.unlocked });
        return;
      }
      if (msg.type === "saveMappings") {
        if (!state.unlocked) { sendResponse({ ok:false, error:"locked" }); return; }
        await saveMappings(msg.entries || []);
        sendResponse({ ok: true });
        return;
      }
      if (msg.type === "lookupTokens") {
        if (!state.unlocked) { sendResponse({ ok:false, error:"locked" }); return; }
        const found = await lookupTokens(msg.tokens || []);
        sendResponse({ ok: true, found });
        return;
      }
    } catch (e) {
      sendResponse({ ok:false, error: String(e) });
    }
  })();
  return true;
});
