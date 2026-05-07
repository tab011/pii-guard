(function inject() {
  try {
    const url = chrome.runtime.getURL('page_inject.js');
    const s = document.createElement('script');
    s.src = url;
    s.async = false;
    (document.head || document.documentElement).appendChild(s);
    s.onload = () => s.remove();
  } catch (e) {
    console.warn('[PII-Guard] injector failed', e);
  }
})();
