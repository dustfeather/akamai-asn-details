/*
Cloudflare Radar API client helpers (non-module for importScripts compatibility)
Attaches wsarRadar to globalThis
*/
(function () {
  if (typeof globalThis.wsarRadar !== 'undefined') return;

  function normalizeAsn(asn) {
    if (!asn) return '';
    var trimmed = String(asn).trim().toUpperCase();
    if (trimmed.startsWith('AS')) return trimmed.slice(2);
    return trimmed;
  }

  function tryParseBotHumanFromUnknown(result) {
    // Heuristic parser: try common shapes and fallbacks
    // Accept either [0..1] or [0..100] values
    function clampPct(n) {
      if (n == null || isNaN(n)) return null;
      var num = Number(n);
      if (num <= 1) return Math.max(0, Math.min(100, num * 100));
      return Math.max(0, Math.min(100, num));
    }

    function search(obj) {
      if (!obj || typeof obj !== 'object') return { human: null, bot: null };
      // Priority keys commonly used
      var human = null; var bot = null;
      Object.keys(obj).forEach(function (k) {
        var v = obj[k];
        var key = k.toLowerCase();
        if (typeof v === 'number') {
          if (key.includes('human')) human = clampPct(v);
          if (key.includes('bot')) bot = clampPct(v);
        } else if (v && typeof v === 'object') {
          var nested = search(v);
          if (nested.human != null && human == null) human = nested.human;
          if (nested.bot != null && bot == null) bot = nested.bot;
        }
      });
      return { human: human, bot: bot };
    }

    var res = search(result || {});
    if (res.human == null && res.bot != null) res.human = 100 - res.bot;
    if (res.bot == null && res.human != null) res.bot = 100 - res.human;
    if (res.human == null || res.bot == null) return null;
    return { humanPct: res.human, botPct: res.bot };
  }

  async function fetchAsnBotHumanBreakdown(asn) {
    var token = await (globalThis.wsarStorage && globalThis.wsarStorage.getSetting('radarToken', ''));
    var baseUrl = await (globalThis.wsarStorage && globalThis.wsarStorage.getSetting('radarBaseUrl', 'https://api.cloudflare.com/client/v4/radar'));
    if (!token) {
      // Return graceful error instead of throwing
      return { 
        humanPct: null, 
        botPct: null, 
        error: 'Cloudflare Radar token not configured. Please set your API token in extension options to view bot/human traffic data.' 
      };
    }
    var asnNum = normalizeAsn(asn);
    var url = baseUrl.replace(/\/$/, '') + '/entities/asns/' + encodeURIComponent(asnNum) + '/http/summary';
    var resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    });
    if (!resp.ok) {
      var text = await resp.text();
      return { 
        humanPct: null, 
        botPct: null, 
        error: 'Radar API error: ' + resp.status + ' ' + text 
      };
    }
    var json = await resp.json();

    // Expected shape is unknown; try heuristics
    var parsed = null;
    if (json && json.result) parsed = tryParseBotHumanFromUnknown(json.result);
    if (!parsed) parsed = tryParseBotHumanFromUnknown(json);
    if (!parsed) {
      return { 
        humanPct: null, 
        botPct: null, 
        error: 'Could not parse Radar response for bot/human breakdown' 
      };
    }
    return { ...parsed, error: null };
  }

  globalThis.wsarRadar = {
    fetchAsnBotHumanBreakdown: fetchAsnBotHumanBreakdown
  };
})();


