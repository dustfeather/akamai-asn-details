// Content script: detects ASN hovers on Akamai WSA dashboard and shows tooltip
(function () {
  var INITED = false;
  var asnRegex = /^AS?\d{1,10}$/i;
  var hoverDelayMs = 200;
  var activeHover = null; // { el, asn, timer, lastPos }

  function isOnWsaPage() {
    var href = location.href;
    return href.indexOf('/apps/security-analytics') !== -1;
  }

  function standardizeAsn(text) {
    if (!text) return null;
    var s = String(text).trim().toUpperCase();
    if (asnRegex.test(s)) {
      return s.startsWith('AS') ? s : ('AS' + s.replace(/^AS/i, ''));
    }
    return null;
  }

  function findAsnFromElement(el) {
    if (!el) return null;
    var node = el;
    for (var i = 0; i < 4 && node; i++) {
      var txt = (node.textContent || '').trim();
      var maybe = standardizeAsn(txt);
      if (maybe) return { asn: maybe, el: node };
      node = node.parentElement;
    }
    return null;
  }

  // Tooltip
  var tooltipRoot = null; var tooltipShadow = null; var tooltipEl = null;
  function ensureTooltip() {
    if (tooltipRoot) return;
    tooltipRoot = document.createElement('div');
    tooltipRoot.id = 'wsar-tooltip-root';
    tooltipRoot.style.position = 'fixed';
    tooltipRoot.style.zIndex = '2147483647';
    tooltipRoot.style.top = '0';
    tooltipRoot.style.left = '0';
    tooltipRoot.style.pointerEvents = 'none';
    tooltipShadow = tooltipRoot.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = '' +
      '.tip{font:12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;' +
      'background: rgba(20,20,20,0.9); color:#fff; padding:8px 10px; border-radius:6px; ' +
      'box-shadow:0 4px 16px rgba(0,0,0,0.3); max-width:240px;}' +
      '.muted{opacity:0.8}' +
      '';
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'tip';
    tooltipShadow.appendChild(style);
    tooltipShadow.appendChild(tooltipEl);
    document.documentElement.appendChild(tooltipRoot);
  }

  function positionTooltip(x, y) {
    if (!tooltipRoot) return;
    var offset = 14;
    var px = x + offset;
    var py = y + offset;
    var vw = document.documentElement.clientWidth || window.innerWidth;
    var vh = document.documentElement.clientHeight || window.innerHeight;
    var rect = tooltipEl.getBoundingClientRect();
    if (px + rect.width + 8 > vw) px = Math.max(8, x - rect.width - offset);
    if (py + rect.height + 8 > vh) py = Math.max(8, y - rect.height - offset);
    tooltipRoot.style.transform = 'translate(' + px + 'px,' + py + 'px)';
  }

  function showTooltipLoading() {
    ensureTooltip();
    tooltipEl.textContent = 'Loading Cloudflare Radar...';
    tooltipEl.classList.remove('muted');
  }

  function showTooltipData(humanPct, botPct) {
    ensureTooltip();
    if (humanPct == null && botPct == null) {
      tooltipEl.textContent = 'No data';
      tooltipEl.classList.add('muted');
    } else {
      var human = (humanPct != null) ? humanPct.toFixed(1) + '% human' : 'human: n/a';
      var bot = (botPct != null) ? botPct.toFixed(1) + '% bot' : 'bot: n/a';
      tooltipEl.textContent = human + ' | ' + bot;
      tooltipEl.classList.remove('muted');
    }
  }

  function showTooltipError(errorMessage) {
    ensureTooltip();
    tooltipEl.textContent = errorMessage;
    tooltipEl.classList.add('muted');
  }

  function hideTooltip() {
    if (!tooltipRoot) return;
    tooltipRoot.style.transform = 'translate(-9999px,-9999px)';
  }

  function onMouseOver(e) {
    if (!isOnWsaPage()) return;
    var found = findAsnFromElement(e.target);
    if (!found) return;
    if (activeHover && activeHover.el === found.el) return;
    clearActiveHover();
    activeHover = { el: found.el, asn: found.asn, timer: null, lastPos: { x: e.clientX, y: e.clientY } };
    showTooltipLoading();
    positionTooltip(e.clientX, e.clientY);
    activeHover.timer = setTimeout(function () {
      requestAsn(found.asn, e.clientX, e.clientY);
    }, hoverDelayMs);
  }

  function onMouseMove(e) {
    if (!activeHover) return;
    activeHover.lastPos = { x: e.clientX, y: e.clientY };
    positionTooltip(e.clientX, e.clientY);
  }

  function onMouseOut(e) {
    if (!activeHover) return;
    if (!e.relatedTarget || !activeHover.el.contains(e.relatedTarget)) {
      clearActiveHover();
    }
  }

  function clearActiveHover() {
    if (activeHover && activeHover.timer) clearTimeout(activeHover.timer);
    activeHover = null;
    hideTooltip();
  }

  function requestAsn(asn, x, y) {
    chrome.runtime.sendMessage({ type: 'RADAR_ASN_STATS', asn: asn }, function (resp) {
      if (!activeHover || activeHover.asn !== asn) return; // stale
      var human = resp && typeof resp.humanPct === 'number' ? resp.humanPct : null;
      var bot = resp && typeof resp.botPct === 'number' ? resp.botPct : null;
      var error = resp && resp.error ? resp.error : null;
      
      if (error) {
        showTooltipError(error);
      } else {
        showTooltipData(human, bot);
      }
      if (activeHover && activeHover.lastPos) positionTooltip(activeHover.lastPos.x, activeHover.lastPos.y);
    });
  }

  // SPA route changes
  function initOnce() {
    if (INITED) return;
    INITED = true;
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseout', onMouseOut, true);
    hideTooltip();
  }

  function hookHistory() {
    var rawPush = history.pushState;
    history.pushState = function () {
      rawPush.apply(this, arguments);
      setTimeout(onRouteMaybeChanged, 0);
    };
    window.addEventListener('popstate', onRouteMaybeChanged);
    window.addEventListener('hashchange', onRouteMaybeChanged);
  }

  function onRouteMaybeChanged() {
    // No-op; hover logic is always active but only triggers on matching text; keep for future enhancements
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOnce);
  } else {
    initOnce();
  }
  hookHistory();
})();


