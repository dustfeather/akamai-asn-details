(function () {
  var els = {};

  function $(id) { return document.getElementById(id); }

  function setStatus(text, ok) {
    els.status.textContent = text || '';
    els.status.style.color = ok ? '#0a7' : '#666';
  }

  async function load() {
    try {
      var items = await new Promise(function (resolve) { chrome.storage.local.get(['radarToken', 'radarBaseUrl', 'ttlDays'], resolve); });
      els.token.value = items.radarToken || '';
      els.baseUrl.value = items.radarBaseUrl || 'https://api.cloudflare.com/client/v4/radar';
      els.ttlDays.value = items.ttlDays != null ? items.ttlDays : 7;
    } catch (e) {
      setStatus('Failed to load settings', false);
    }
  }

  async function save() {
    var token = els.token.value.trim();
    var baseUrl = els.baseUrl.value.trim() || 'https://api.cloudflare.com/client/v4/radar';
    var ttlDays = parseInt(els.ttlDays.value, 10);
    if (!isFinite(ttlDays) || ttlDays <= 0) ttlDays = 7;
    await new Promise(function (resolve) { chrome.storage.local.set({ radarToken: token, radarBaseUrl: baseUrl, ttlDays: ttlDays }, resolve); });
    setStatus('Saved', true);
    setTimeout(function () { setStatus('', true); }, 1500);
  }

  function init() {
    els.token = $('token');
    els.baseUrl = $('baseUrl');
    els.ttlDays = $('ttlDays');
    els.save = $('save');
    els.status = $('status');
    els.save.addEventListener('click', save);
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();


