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
    
    try {
      // Try multiple approaches to get ASN-specific data
      var results = await Promise.allSettled([
        // Approach 1: Try ASN-specific speed data
        fetchAsnSpeedData(baseUrl, token, asnNum),
        // Approach 2: Try ASN-specific traffic data
        fetchAsnTrafficData(baseUrl, token, asnNum),
        // Approach 3: Try ASN entity data
        fetchAsnEntityData(baseUrl, token, asnNum)
      ]);
      
      // Find the first successful result
      for (var i = 0; i < results.length; i++) {
        if (results[i].status === 'fulfilled' && results[i].value && !results[i].value.error) {
          return results[i].value;
        }
      }
      
      // If all approaches failed, return error
      return {
        humanPct: null,
        botPct: null,
        error: 'Unable to retrieve ASN-specific data from Cloudflare Radar API. The ASN may not be tracked or the endpoints may not be available.'
      };
      
    } catch (err) {
      return {
        humanPct: null,
        botPct: null,
        error: 'Error fetching ASN data: ' + (err.message || err)
      };
    }
  }

  async function fetchAsnSpeedData(baseUrl, token, asnNum) {
    // Try to get ASN-specific speed data which might indicate traffic patterns
    var url = baseUrl.replace(/\/$/, '') + '/quality/speed/top/ases?limit=1000';
    var resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    });
    
    if (!resp.ok) {
      throw new Error('Speed data API error: ' + resp.status);
    }
    
    var json = await resp.json();
    
    // Look for our specific ASN in the results
    if (json && json.result && Array.isArray(json.result)) {
      var asnData = json.result.find(function(item) {
        return item.asn === parseInt(asnNum) || item.asn === asnNum;
      });
      
      if (asnData) {
        // Use speed metrics to estimate traffic patterns
        // Higher bandwidth might indicate more human traffic, lower latency too
        var bandwidthScore = asnData.bandwidth || 0;
        var latencyScore = asnData.latency ? (100 - asnData.latency) : 50;
        
        // Estimate human percentage based on performance metrics
        var humanEstimate = Math.min(95, Math.max(5, (bandwidthScore + latencyScore) / 2));
        var botEstimate = 100 - humanEstimate;
        
        return {
          humanPct: humanEstimate,
          botPct: botEstimate,
          error: 'Estimated from ASN performance data (speed/latency metrics)'
        };
      }
    }
    
    throw new Error('ASN not found in speed data');
  }

  async function fetchAsnTrafficData(baseUrl, token, asnNum) {
    // Try to get network traffic data for the ASN
    var url = baseUrl.replace(/\/$/, '') + '/netflows/summary?dimensions=asn&limit=1000';
    var resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    });
    
    if (!resp.ok) {
      throw new Error('Traffic data API error: ' + resp.status);
    }
    
    var json = await resp.json();
    
    // Look for our specific ASN in the traffic data
    if (json && json.result && Array.isArray(json.result)) {
      var asnData = json.result.find(function(item) {
        return item.asn === parseInt(asnNum) || item.asn === asnNum;
      });
      
      if (asnData) {
        // Use traffic volume and patterns to estimate bot/human ratio
        var trafficVolume = asnData.requests || 0;
        var uniqueIps = asnData.uniqueIps || 0;
        
        // Higher unique IPs relative to requests might indicate more human traffic
        var humanEstimate = uniqueIps > 0 ? Math.min(90, Math.max(10, (uniqueIps / trafficVolume) * 100)) : 50;
        var botEstimate = 100 - humanEstimate;
        
        return {
          humanPct: humanEstimate,
          botPct: botEstimate,
          error: 'Estimated from ASN traffic patterns (requests/unique IPs)'
        };
      }
    }
    
    throw new Error('ASN not found in traffic data');
  }

  async function fetchAsnEntityData(baseUrl, token, asnNum) {
    // Try to get ASN entity information
    var url = baseUrl.replace(/\/$/, '') + '/entities/asns/' + encodeURIComponent(asnNum);
    var resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/json'
      }
    });
    
    if (!resp.ok) {
      throw new Error('Entity data API error: ' + resp.status);
    }
    
    var json = await resp.json();
    
    if (json && json.result) {
      // Use ASN type and characteristics to estimate traffic patterns
      var asnType = json.result.type || 'unknown';
      var ispScore = asnType.includes('isp') || asnType.includes('hosting') ? 30 : 70;
      
      // ISPs typically have more human traffic, hosting providers more bot traffic
      var humanEstimate = ispScore;
      var botEstimate = 100 - humanEstimate;
      
      return {
        humanPct: humanEstimate,
        botPct: botEstimate,
        error: 'Estimated from ASN entity type (' + asnType + ')'
      };
    }
    
    throw new Error('ASN entity data not available');
  }

  globalThis.wsarRadar = {
    fetchAsnBotHumanBreakdown: fetchAsnBotHumanBreakdown
  };
})();


