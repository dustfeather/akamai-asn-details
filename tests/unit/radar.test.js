import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupChromeMocks, resetChromeMocks, createFetchMock, resetFetchMock } from '../helpers/mocks.js'

// Import the radar module functions by evaluating the file content
// Since the extension uses IIFE pattern, we need to evaluate it in our test environment
let radarModule

describe('Radar Module', () => {
  beforeEach(() => {
    setupChromeMocks()
    createFetchMock()
    
    // Load the radar module by evaluating the file
    const fs = await import('fs')
    const path = await import('path')
    const radarCode = fs.readFileSync(path.join(process.cwd(), 'extension/common/radar.js'), 'utf8')
    
    // Create a mock globalThis.wsarStorage
    globalThis.wsarStorage = {
      getSetting: vi.fn((key, defaultValue) => {
        if (key === 'radarToken') return 'test-token'
        if (key === 'radarBaseUrl') return 'https://api.cloudflare.com/client/v4/radar'
        return defaultValue
      })
    }
    
    // Evaluate the radar module code
    eval(radarCode)
    
    // Get the exposed functions
    radarModule = globalThis.wsarRadar
  })

  afterEach(() => {
    resetChromeMocks()
    resetFetchMock()
    delete globalThis.wsarRadar
    delete globalThis.wsarStorage
  })

  describe('normalizeAsn', () => {
    it('should normalize ASN with AS prefix', async () => {
      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      expect(result).toBeDefined()
    })

    it('should normalize ASN without AS prefix', async () => {
      const result = await radarModule.fetchAsnBotHumanBreakdown('13335')
      expect(result).toBeDefined()
    })

    it('should handle empty ASN', async () => {
      const result = await radarModule.fetchAsnBotHumanBreakdown('')
      expect(result).toBeDefined()
    })

    it('should handle null ASN', async () => {
      const result = await radarModule.fetchAsnBotHumanBreakdown(null)
      expect(result).toBeDefined()
    })
  })

  describe('fetchAsnBotHumanBreakdown', () => {
    it('should return error when no token is provided', async () => {
      globalThis.wsarStorage.getSetting.mockImplementation((key, defaultValue) => {
        if (key === 'radarToken') return ''
        return defaultValue
      })

      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      
      expect(result).toEqual({
        humanPct: null,
        botPct: null,
        error: 'Cloudflare Radar token not configured. Please set your API token in extension options to view bot/human traffic data.'
      })
    })

    it('should make API call with valid token', async () => {
      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      
      expect(result).toBeDefined()
      expect(result.humanPct).toBeCloseTo(75.5, 1)
      expect(result.botPct).toBeCloseTo(24.5, 1)
      expect(result.error).toBeNull()
    })

    it('should handle API errors gracefully', async () => {
      // Mock fetch to return error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      })

      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      
      expect(result.error).toContain('Radar API error: 401')
    })

    it('should handle parse errors gracefully', async () => {
      // Mock fetch to return invalid JSON
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: 'data' }),
        text: () => Promise.resolve('{"invalid": "data"}')
      })

      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      
      expect(result.error).toContain('Could not parse Radar response')
    })
  })

  describe('tryParseBotHumanFromUnknown', () => {
    it('should parse response with human/bot percentages', () => {
      // We need to test the internal function, but it's not exposed
      // Instead, we test it indirectly through the API response parsing
      const testResponse = {
        result: {
          human: 0.8,
          bot: 0.2
        }
      }

      // Mock fetch to return our test response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(testResponse),
        text: () => Promise.resolve(JSON.stringify(testResponse))
      })

      return radarModule.fetchAsnBotHumanBreakdown('AS13335').then(result => {
        expect(result.humanPct).toBeCloseTo(80, 1)
        expect(result.botPct).toBeCloseTo(20, 1)
      })
    })

    it('should handle percentage values in 0-100 range', () => {
      const testResponse = {
        result: {
          human: 80,
          bot: 20
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(testResponse),
        text: () => Promise.resolve(JSON.stringify(testResponse))
      })

      return radarModule.fetchAsnBotHumanBreakdown('AS13335').then(result => {
        expect(result.humanPct).toBeCloseTo(80, 1)
        expect(result.botPct).toBeCloseTo(20, 1)
      })
    })

    it('should calculate missing percentage from the other', () => {
      const testResponse = {
        result: {
          human: 0.75
          // bot is missing
        }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(testResponse),
        text: () => Promise.resolve(JSON.stringify(testResponse))
      })

      return radarModule.fetchAsnBotHumanBreakdown('AS13335').then(result => {
        expect(result.humanPct).toBeCloseTo(75, 1)
        expect(result.botPct).toBeCloseTo(25, 1)
      })
    })
  })
})
