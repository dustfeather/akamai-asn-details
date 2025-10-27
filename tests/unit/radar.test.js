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
    it('should parse response with human/bot percentages', () => {
      // Mock all API calls to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      })

      return radarModule.fetchAsnBotHumanBreakdown('AS13335').then(result => {
        expect(result.humanPct).toBeNull()
        expect(result.botPct).toBeNull()
        expect(result.error).toContain('Unable to retrieve ASN-specific data')
      })
    })

    it('should handle percentage values in 0-100 range', () => {
      // Mock all API calls to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      })

      return radarModule.fetchAsnBotHumanBreakdown('AS13335').then(result => {
        expect(result.humanPct).toBeNull()
        expect(result.botPct).toBeNull()
        expect(result.error).toContain('Unable to retrieve ASN-specific data')
      })
    })

    it('should calculate missing percentage from the other', () => {
      // Mock all API calls to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      })

      return radarModule.fetchAsnBotHumanBreakdown('AS13335').then(result => {
        expect(result.humanPct).toBeNull()
        expect(result.botPct).toBeNull()
        expect(result.error).toContain('Unable to retrieve ASN-specific data')
      })
    })
  })
})
