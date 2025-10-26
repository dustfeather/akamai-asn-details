/*
Global storage helpers for MV3 extension (non-module for importScripts compatibility)
Attaches wsarStorage to globalThis
*/
(function () {
  if (typeof globalThis.wsarStorage !== 'undefined') return;

  function getLocal(keys) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.get(keys, function (items) { resolve(items || {}); });
      } catch (e) {
        resolve({});
      }
    });
  }

  function setLocal(obj) {
    return new Promise(function (resolve) {
      try {
        chrome.storage.local.set(obj, function () { resolve(); });
      } catch (e) {
        resolve();
      }
    });
  }

  async function getSetting(key, defaultValue) {
    var items = await getLocal([key]);
    if (Object.prototype.hasOwnProperty.call(items, key)) return items[key];
    return defaultValue;
  }

  async function setSetting(key, value) {
    var obj = {};
    obj[key] = value;
    await setLocal(obj);
  }

  async function getCachedRaw(key) {
    var items = await getLocal([key]);
    if (!Object.prototype.hasOwnProperty.call(items, key)) return null;
    return items[key];
  }

  async function setCachedRaw(key, value) {
    var obj = {};
    obj[key] = value;
    await setLocal(obj);
  }

  async function getFresh(key, maxAgeMs) {
    var wrapped = await getCachedRaw(key);
    if (!wrapped || typeof wrapped !== 'object') return null;
    var fetchedAt = wrapped.fetchedAt || 0;
    if (Date.now() - fetchedAt > maxAgeMs) return null;
    return wrapped.data;
  }

  async function setWithTimestamp(key, data) {
    await setCachedRaw(key, { data: data, fetchedAt: Date.now() });
  }

  globalThis.wsarStorage = {
    getLocal: getLocal,
    setLocal: setLocal,
    getSetting: getSetting,
    setSetting: setSetting,
    getCachedRaw: getCachedRaw,
    setCachedRaw: setCachedRaw,
    getFresh: getFresh,
    setWithTimestamp: setWithTimestamp
  };
})();


