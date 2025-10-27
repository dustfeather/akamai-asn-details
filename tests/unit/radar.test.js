import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupChromeMocks, resetChromeMocks, createFetchMock, resetFetchMock } from '../helpers/mocks.js'

// Import the radar module functions by evaluating the file content
// Since the extension uses IIFE pattern, we need to evaluate it in our test environment
let radarModule

describe('Radar Module', () => {
  beforeEach(async () => {
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
    it('should normalize ASN with AS prefix', () => {
      const result = radarModule.normalizeAsn('AS13335')
      expect(result).toBe('13335')
    })

    it('should normalize ASN without AS prefix', () => {
      const result = radarModule.normalizeAsn('13335')
      expect(result).toBe('13335')
    })

    it('should handle ASN with lowercase as prefix', () => {
      const result = radarModule.normalizeAsn('as13335')
      expect(result).toBe('13335')
    })

    it('should handle ASN with mixed case', () => {
      const result = radarModule.normalizeAsn('As13335')
      expect(result).toBe('13335')
    })

    it('should handle empty ASN', () => {
      const result = radarModule.normalizeAsn('')
      expect(result).toBe('')
    })

    it('should handle null ASN', () => {
      const result = radarModule.normalizeAsn(null)
      expect(result).toBe('')
    })

    it('should handle undefined ASN', () => {
      const result = radarModule.normalizeAsn(undefined)
      expect(result).toBe('')
    })

    it('should trim whitespace', () => {
      const result = radarModule.normalizeAsn('  AS13335  ')
      expect(result).toBe('13335')
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
      // Mock successful ASN speed data response for all API calls
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
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
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Bad Request')
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          text: () => Promise.resolve('Bad Request')
        })

      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      
      expect(result).toBeDefined()
      expect(result.humanPct).toBeNull()
      expect(result.botPct).toBeNull()
      expect(result.error).toContain('Unable to retrieve ASN-specific data')
    })

    it('should handle API errors gracefully', async () => {
      // Mock fetch to return error for all approaches
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      })

      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      
      expect(result.error).toContain('Unable to retrieve ASN-specific data')
    })

    it('should handle parse errors gracefully', async () => {
      // Mock fetch to return errors for all approaches
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      })

      const result = await radarModule.fetchAsnBotHumanBreakdown('AS13335')
      
      // Should return error when all approaches fail
      expect(result.humanPct).toBeNull()
      expect(result.botPct).toBeNull()
      expect(result.error).toContain('Unable to retrieve ASN-specific data')
    })
  })

  describe('tryParseBotHumanFromUnknown', () => {
    it('should parse response with human/bot percentages in 0-1 range', () => {
      const result = radarModule.tryParseBotHumanFromUnknown({
        human: 0.75,
        bot: 0.25
      })
      
      expect(result).toEqual({
        humanPct: 75,
        botPct: 25
      })
    })

    it('should parse response with human/bot percentages in 0-100 range', () => {
      const result = radarModule.tryParseBotHumanFromUnknown({
        humanPercentage: 80,
        botPercentage: 20
      })
      
      expect(result).toEqual({
        humanPct: 80,
        botPct: 20
      })
    })

    it('should calculate missing percentage from the other', () => {
      const result = radarModule.tryParseBotHumanFromUnknown({
        human: 0.60
        // bot percentage missing
      })
      
      expect(result).toEqual({
        humanPct: 60,
        botPct: 40 // Should be calculated as 100 - 60
      })
    })

    it('should handle nested object structures', () => {
      const result = radarModule.tryParseBotHumanFromUnknown({
        traffic: {
          breakdown: {
            humanTraffic: 0.85,
            botTraffic: 0.15
          }
        }
      })
      
      expect(result).toEqual({
        humanPct: 85,
        botPct: 15
      })
    })

    it('should return null for invalid data', () => {
      const result = radarModule.tryParseBotHumanFromUnknown(null)
      expect(result).toBeNull()
    })

    it('should return null for non-object data', () => {
      const result = radarModule.tryParseBotHumanFromUnknown('invalid')
      expect(result).toBeNull()
    })

    it('should return null when no percentages found', () => {
      const result = radarModule.tryParseBotHumanFromUnknown({
        someOtherData: 'value'
      })
      expect(result).toBeNull()
    })

    it('should clamp percentages to valid range', () => {
      const result = radarModule.tryParseBotHumanFromUnknown({
        human: 150, // Should be clamped to 100
        bot: -10    // Should be clamped to 0
      })
      
      expect(result).toEqual({
        humanPct: 100, // 150 > 100, so clamped to 100
        botPct: 0      // -10 < 0, so clamped to 0
      })
    })
  })
})
