/* background.js – single source of truth for token map */
const KEY = "pii_map_v1";
const LIMIT = 5000; // safety cap
const TTL_MS = 7 * 24 * 3600 * 1000; // one week
async function loadMap() {
  const { [KEY]: bag = {} } = await chrome.storage.local.get(KEY);
  return bag; // { token: { v: "actual", t: timestamp } }
}
async function saveEntries(entries) {
  const map = await loadMap();
  const now = Date.now();
  for (const { token, value } of entries) {
    map[token] = { v: value, t: now };
  }
  const keys = Object.keys(map);
  if (keys.length > LIMIT) {
    keys.sort((a, b) => map[a].t - map[b].t);
    for (let i = 0; i < keys.length - LIMIT; i++) delete map[keys[i]];
  }
  await chrome.storage.local.set({ [KEY]: map });
  return true;
}
async function clearStale() {
  const map = await loadMap();
  const cutoff = Date.now() - TTL_MS;
  let changed = false;
  for (const k of Object.keys(map)) {
    if ((map[k]?.t || 0) < cutoff) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) await chrome.storage.local.set({ [KEY]: map });
}
chrome.runtime.onInstalled.addListener(() => clearStale());
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === "saveMappings") {
        await saveEntries(msg.entries || []);
        sendResponse({ ok: true });
      } else if (msg?.type === "loadMappings") {
        const map = await loadMap();
        sendResponse({ ok: true, map });
      } else if (msg?.type === "purgeOld") {
        await clearStale();
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "unknown_message_type" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true;
});