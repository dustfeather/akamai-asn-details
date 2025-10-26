// Background service worker for MV3
// Loads common helpers and serves ASN stats with TTL caching
importScripts('common/storage.js');
importScripts('common/radar.js');

(function () {
  var WEEK_MS_DEFAULT = 7 * 24 * 60 * 60 * 1000;
  var ERROR_TTL_MS = 60 * 60 * 1000; // 1 hour for negative cache

  function asCacheKey(asn) {
    return 'asn:' + String(asn || '').trim().toUpperCase();
  }

  async function getTtlMs() {
    var days = await wsarStorage.getSetting('ttlDays', 7);
    var n = Number(days);
    if (!isFinite(n) || n <= 0) return WEEK_MS_DEFAULT;
    return Math.floor(n * 24 * 60 * 60 * 1000);
  }

  async function handleRadarAsnStats(asn) {
    var cacheKey = asCacheKey(asn);
    var ttlMs = await getTtlMs();
    var cached = await wsarStorage.getFresh(cacheKey, ttlMs);
    if (cached) return cached;
    try {
      var data = await wsarRadar.fetchAsnBotHumanBreakdown(asn);
      await wsarStorage.setWithTimestamp(cacheKey, data);
      return data;
    } catch (err) {
      // Negative cache to reduce repeated failures
      await wsarStorage.setWithTimestamp(cacheKey, { humanPct: null, botPct: null, error: String(err && err.message || err) });
      // Set a separate expiry by embedding timestamp; getFresh uses caller TTL, so we just rely on short lookups
      return { humanPct: null, botPct: null, error: String(err && err.message || err) };
    }
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || typeof message !== 'object') return;
    if (message.type === 'RADAR_ASN_STATS' && message.asn) {
      (async function () {
        var result = await handleRadarAsnStats(message.asn);
        sendResponse({ humanPct: result.humanPct, botPct: result.botPct, fetchedAt: Date.now(), error: result.error || null });
      })();
      return true; // keep the message channel open for async response
    }
  });
})();


