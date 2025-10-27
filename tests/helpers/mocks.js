// Chrome API mocks for testing browser extension functionality
// These mocks simulate the chrome.storage and chrome.runtime APIs

import { vi } from 'vitest'

export function createChromeMocks() {
  const storage = {
    local: {
      data: new Map(),
      get: vi.fn((keys, callback) => {
        const result = {};
        const keyArray = Array.isArray(keys) ? keys : Object.keys(keys);
        keyArray.forEach(key => {
          if (storage.local.data.has(key)) {
            result[key] = storage.local.data.get(key);
          }
        });
        callback(result);
      }),
      set: vi.fn((items, callback) => {
        Object.entries(items).forEach(([key, value]) => {
          storage.local.data.set(key, value);
        });
        if (callback) callback();
      }),
      remove: vi.fn((keys, callback) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => storage.local.data.delete(key));
        if (callback) callback();
      }),
      clear: vi.fn((callback) => {
        storage.local.data.clear();
        if (callback) callback();
      })
    }
  };

  const runtime = {
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false)
    },
    sendMessage: vi.fn((message, callback) => {
      // Mock response for RADAR_ASN_STATS messages
      if (message && message.type === 'RADAR_ASN_STATS') {
        const mockResponse = {
          humanPct: 75.5,
          botPct: 24.5,
          fetchedAt: Date.now(),
          error: null
        };
        if (callback) callback(mockResponse);
      }
    }),
    lastError: null
  };

  return {
    storage,
    runtime
  };
}

export function setupChromeMocks() {
  const mocks = createChromeMocks();
  
  // Mock global chrome object
  global.chrome = {
    storage: mocks.storage,
    runtime: mocks.runtime
  };

  return mocks;
}

export function resetChromeMocks() {
  if (global.chrome) {
    delete global.chrome;
  }
}

// Mock fetch for API testing
export function createFetchMock() {
  const originalFetch = global.fetch;
  
  const mockFetch = vi.fn((url, options) => {
    // Mock Cloudflare Radar API responses for different endpoints
    if (url.includes('api.cloudflare.com/client/v4/radar')) {
      // Mock speed data endpoint
      if (url.includes('/quality/speed/top/ases')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            result: [
              {
                asn: 13335,
                bandwidth: 80,
                latency: 20
              }
            ]
          })
        });
      }
      
      // Mock traffic data endpoint
      if (url.includes('/netflows/summary')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            result: [
              {
                asn: 13335,
                requests: 1000,
                uniqueIps: 800
              }
            ]
          })
        });
      }
      
      // Mock entity data endpoint
      if (url.includes('/entities/asns/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            result: {
              type: 'isp',
              name: 'Test ISP'
            }
          })
        });
      }
      
      // Default response for other radar endpoints
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          result: {
            human: 0.755,
            bot: 0.245
          }
        }),
        text: () => Promise.resolve(JSON.stringify({
          result: {
            human: 0.755,
            bot: 0.245
          }
        }))
      });
    }
    
    // Fallback to original fetch for other URLs
    return originalFetch(url, options);
  });

  global.fetch = mockFetch;
  return mockFetch;
}

export function resetFetchMock() {
  global.fetch = undefined;
}
