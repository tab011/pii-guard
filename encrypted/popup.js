
function set(text, cls, id) {
  const el = document.getElementById(id);
  el.textContent = text || "";
  el.className = "status " + (cls || "");
  if (text) setTimeout(()=>{ el.textContent=""; el.className="status"; }, 1800);
}

function loadSettings() {
  chrome.runtime.sendMessage({ type: "getSettings" }, ({ settings }) => {
    document.getElementById("pasteGuard").checked = !!settings.pasteGuard;
    document.getElementById("copyGuard").checked = !!settings.copyGuard;
    document.getElementById("sendGuard").checked = !!settings.sendGuard;
  });
  chrome.runtime.sendMessage({ type: "status" }, ({ unlocked }) => {
    document.getElementById("ustat").textContent = unlocked ? "Unlocked" : "Locked";
    document.getElementById("ustat").className = "status " + (unlocked ? "ok":"err");
  });
}

document.getElementById("save").addEventListener("click", () => {
  const settings = {
    pasteGuard: document.getElementById("pasteGuard").checked,
    copyGuard: document.getElementById("copyGuard").checked,
    sendGuard: document.getElementById("sendGuard").checked
  };
  chrome.runtime.sendMessage({ type: "setSettings", settings }, () => set("Saved", "ok", "sstat"));
});

document.getElementById("unlock").addEventListener("click", () => {
  const pw = document.getElementById("pw").value;
  if (!pw) return set("Enter passphrase", "err", "ustat");
  chrome.runtime.sendMessage({ type: "unlock", passphrase: pw }, (resp) => {
    if (resp && resp.ok) set("Unlocked", "ok", "ustat");
    else set("Unlock failed", "err", "ustat");
  });
});

document.getElementById("lock").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "lock" }, () => set("Locked", "err", "ustat"));
});

loadSettings();
