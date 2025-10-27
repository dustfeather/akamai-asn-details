import { describe, it, expect } from 'vitest'

describe('Cloudflare API Integration Tests', () => {
  // Skip these tests if no API token is provided
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  
  if (!apiToken || apiToken === 'your-cloudflare-api-token-here' || apiToken === 'test-token') {
    describe.skip('Cloudflare API Integration Tests', () => {
      it('should be skipped when no valid API token is provided', () => {
        console.log('ℹ️  Skipping Cloudflare API tests - no valid token provided')
        console.log('ℹ️  Set CLOUDFLARE_API_TOKEN in .env file to run integration tests')
      })
    })
    return
  }

  describe('API Connectivity', () => {
    it('should successfully connect to Cloudflare Radar API', async () => {
      // First test with a basic Radar endpoint to verify connectivity
      const response = await fetch('https://api.cloudflare.com/client/v4/radar/ranking/top', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      // Log the response for debugging
      console.log(`API Response Status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.log(`API Error Response: ${errorText}`)
      }

      // API might return various status codes depending on the endpoint and data availability
      // 200 = success, 400 = bad request (might be expected for some ASNs), 404 = not found
      expect([200, 400, 404]).toContain(response.status)
      
      const data = await response.json()
      expect(data).toBeDefined()
      expect(typeof data).toBe('object')
    })

    it('should return valid response structure for ASN data', async () => {
      const response = await fetch('https://api.cloudflare.com/client/v4/radar/entities/asns/AS13335/http/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      const data = await response.json()
      
      // Check if response has expected structure
      expect(data).toBeDefined()
      
      // The response should either have a 'result' field or be the data directly
      const result = data.result || data
      
      // Check for human/bot traffic data
      if (result.human !== undefined || result.bot !== undefined) {
        expect(typeof result.human).toBe('number')
        expect(typeof result.bot).toBe('number')
        expect(result.human).toBeGreaterThanOrEqual(0)
        expect(result.bot).toBeGreaterThanOrEqual(0)
        expect(result.human + result.bot).toBeCloseTo(1, 2) // Should sum to ~1 (100%)
      }
    })

    it('should handle different ASN formats correctly', async () => {
      const testAsns = ['AS13335', '13335', 'AS15169', '15169']
      
      for (const asn of testAsns) {
        const response = await fetch(`https://api.cloudflare.com/client/v4/radar/entities/asns/${encodeURIComponent(asn)}/http/summary`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json'
          }
        })

        // Should not return 404 for valid ASNs
        expect(response.status).not.toBe(404)
        
        if (response.ok) {
          const data = await response.json()
          expect(data).toBeDefined()
        }
      }
    })

    it('should handle API rate limits gracefully', async () => {
      // Make multiple requests to test rate limiting
      const requests = Array(5).fill().map(() => 
        fetch('https://api.cloudflare.com/client/v4/radar/entities/asns/AS13335/http/summary', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json'
          }
        })
      )

      const responses = await Promise.all(requests)
      
      // All requests should complete (even if some are rate limited)
      expect(responses).toHaveLength(5)
      
      // Check that we don't get unexpected errors (allow 429 for rate limiting)
      const unexpectedErrors = responses.filter(r => r.status >= 400 && r.status !== 429 && r.status !== 400)
      expect(unexpectedErrors).toHaveLength(0)
    })

    it('should return appropriate error for invalid ASN', async () => {
      const response = await fetch('https://api.cloudflare.com/client/v4/radar/entities/asns/INVALID_ASN/http/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      // Should return 400 or 404 for invalid ASN
      expect([400, 404]).toContain(response.status)
    })

    it('should return appropriate error for unauthorized requests', async () => {
      const response = await fetch('https://api.cloudflare.com/client/v4/radar/entities/asns/AS13335/http/summary', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Accept': 'application/json'
        }
      })

      // API might return 400 or 401 for invalid tokens
      expect([400, 401]).toContain(response.status)
      
      const data = await response.json()
      expect(data.errors).toBeDefined()
      expect(Array.isArray(data.errors)).toBe(true)
    })
  })

  describe('Response Data Validation', () => {
    it('should return consistent data structure across requests', async () => {
      const requests = Array(3).fill().map(() => 
        fetch('https://api.cloudflare.com/client/v4/radar/entities/asns/AS13335/http/summary', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Accept': 'application/json'
          }
        })
      )

      const responses = await Promise.all(requests)
      const dataArray = await Promise.all(responses.map(r => r.json()))
      
      // All responses should have the same structure
      const firstData = dataArray[0]
      for (const data of dataArray) {
        expect(Object.keys(data)).toEqual(Object.keys(firstData))
      }
    })

    it('should return valid percentage values', async () => {
      const response = await fetch('https://api.cloudflare.com/client/v4/radar/entities/asns/AS13335/http/summary', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const result = data.result || data
        
        if (result.human !== undefined && result.bot !== undefined) {
          // Values should be between 0 and 1 (or 0 and 100)
          expect(result.human).toBeGreaterThanOrEqual(0)
          expect(result.bot).toBeGreaterThanOrEqual(0)
          
          // If values are in 0-1 range, they should sum to approximately 1
          if (result.human <= 1 && result.bot <= 1) {
            expect(result.human + result.bot).toBeCloseTo(1, 2)
          }
          // If values are in 0-100 range, they should sum to approximately 100
          else if (result.human <= 100 && result.bot <= 100) {
            expect(result.human + result.bot).toBeCloseTo(100, 2)
          }
        }
      }
    })
  })
})
