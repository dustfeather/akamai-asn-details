import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createExtensionTest } from './helpers/setup.js'

describe('Extension E2E Tests', () => {
  let extensionTest

  beforeAll(async () => {
    extensionTest = createExtensionTest()
    await extensionTest.launchBrowser()
  })

  afterAll(async () => {
    await extensionTest.closeBrowser()
  })

  describe('Extension Loading', () => {
    it('should load extension successfully', async () => {
      expect(extensionTest.extensionId).toBeTruthy()
      expect(extensionTest.extensionId).toMatch(/^[a-z]{32}$/)
    })

    it('should have correct manifest', async () => {
      const manifest = await extensionTest.getExtensionManifest()
      
      expect(manifest.name).toBe('WSA ASN Radar Tooltip')
      expect(manifest.version).toBe('0.1.0')
      expect(manifest.manifest_version).toBe(3)
      expect(manifest.permissions).toContain('storage')
      expect(manifest.host_permissions).toContain('https://control.akamai.com/*')
      expect(manifest.host_permissions).toContain('https://api.cloudflare.com/*')
    })
  })

  describe('Options Page', () => {
    it('should load options page', async () => {
      await extensionTest.navigateToOptions()
      
      const title = await extensionTest.page.title()
      expect(title).toBe('WSA ASN Radar Tooltip – Options')
      
      // Check for required form elements
      const tokenInput = await extensionTest.page.$('#token')
      const baseUrlInput = await extensionTest.page.$('#baseUrl')
      const ttlInput = await extensionTest.page.$('#ttlDays')
      const saveButton = await extensionTest.page.$('#save')
      
      expect(tokenInput).toBeTruthy()
      expect(baseUrlInput).toBeTruthy()
      expect(ttlInput).toBeTruthy()
      expect(saveButton).toBeTruthy()
    })

    it('should save token configuration', async () => {
      const testToken = process.env.CLOUDFLARE_API_TOKEN || 'test-token-12345'
      
      await extensionTest.setTokenInOptions(testToken)
      
      // Verify token was saved by checking the input value
      const tokenValue = await extensionTest.page.$eval('#token', el => el.value)
      expect(tokenValue).toBe(testToken)
    })

    it('should clear token configuration', async () => {
      await extensionTest.clearTokenInOptions()
      
      // Verify token was cleared
      const tokenValue = await extensionTest.page.$eval('#token', el => el.value)
      expect(tokenValue).toBe('')
    })

    it('should have default values', async () => {
      await extensionTest.navigateToOptions()
      
      const baseUrlValue = await extensionTest.page.$eval('#baseUrl', el => el.value)
      const ttlValue = await extensionTest.page.$eval('#ttlDays', el => el.value)
      
      expect(baseUrlValue).toBe('https://api.cloudflare.com/client/v4/radar')
      expect(ttlValue).toBe('7')
    })
  })

  describe('Tooltip Functionality', () => {
    it('should show tooltip with valid token', async () => {
      const testToken = process.env.CLOUDFLARE_API_TOKEN || 'test-token-12345'
      
      // Set token and mock API
      await extensionTest.setTokenInOptions(testToken)
      await extensionTest.mockCloudflareAPI()
      
      // Hover over ASN element
      await extensionTest.hoverAsnElement('AS13335')
      
      // Wait for tooltip to appear
      await extensionTest.waitForTooltip()
      
      // Check tooltip content
      const tooltipContent = await extensionTest.getTooltipContent()
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent).toContain('human')
      expect(tooltipContent).toContain('bot')
    })

    it('should show error message without token', async () => {
      // Clear token
      await extensionTest.clearTokenInOptions()
      
      // Hover over ASN element
      await extensionTest.hoverAsnElement('AS13335')
      
      // Wait for tooltip to appear
      await extensionTest.waitForTooltip()
      
      // Check tooltip content shows error
      const tooltipContent = await extensionTest.getTooltipContent()
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent).toContain('token not configured')
    })

    it('should show error message with invalid token', async () => {
      const invalidToken = 'invalid-token'
      
      // Set invalid token and mock API error
      await extensionTest.setTokenInOptions(invalidToken)
      await extensionTest.mockCloudflareAPIError(401)
      
      // Hover over ASN element
      await extensionTest.hoverAsnElement('AS13335')
      
      // Wait for tooltip to appear
      await extensionTest.waitForTooltip()
      
      // Check tooltip content shows error
      const tooltipContent = await extensionTest.getTooltipContent()
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent).toContain('No data')
    })

    it('should handle different ASN formats', async () => {
      const testToken = process.env.CLOUDFLARE_API_TOKEN || 'test-token-12345'
      
      await extensionTest.setTokenInOptions(testToken)
      await extensionTest.mockCloudflareAPI()
      
      const asnFormats = ['AS13335', 'AS15169', 'AS32934']
      
      for (const asn of asnFormats) {
        await extensionTest.hoverAsnElement(asn)
        await extensionTest.waitForTooltip()
        
        const tooltipContent = await extensionTest.getTooltipContent()
        expect(tooltipContent).toBeTruthy()
        expect(tooltipContent).toContain('human')
        expect(tooltipContent).toContain('bot')
      }
    })

    it('should position tooltip correctly', async () => {
      const testToken = process.env.CLOUDFLARE_API_TOKEN || 'test-token-12345'
      
      await extensionTest.setTokenInOptions(testToken)
      await extensionTest.mockCloudflareAPI()
      
      await extensionTest.hoverAsnElement('AS13335')
      await extensionTest.waitForTooltip()
      
      // Check tooltip positioning
      const tooltip = await extensionTest.page.$('#wsar-tooltip-root')
      expect(tooltip).toBeTruthy()
      
      const tooltipBox = await tooltip.boundingBox()
      expect(tooltipBox).toBeTruthy()
      expect(tooltipBox.width).toBeGreaterThan(0)
      expect(tooltipBox.height).toBeGreaterThan(0)
    })
  })

  describe('Caching Behavior', () => {
    it('should cache API responses', async () => {
      const testToken = process.env.CLOUDFLARE_API_TOKEN || 'test-token-12345'
      
      await extensionTest.setTokenInOptions(testToken)
      await extensionTest.mockCloudflareAPI()
      
      // First hover - should make API call
      await extensionTest.hoverAsnElement('AS13335')
      await extensionTest.waitForTooltip()
      
      // Second hover - should use cached data
      await extensionTest.hoverAsnElement('AS13335')
      await extensionTest.waitForTooltip()
      
      // Both should show the same content
      const tooltipContent = await extensionTest.getTooltipContent()
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent).toContain('human')
      expect(tooltipContent).toContain('bot')
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const testToken = process.env.CLOUDFLARE_API_TOKEN || 'test-token-12345'
      
      await extensionTest.setTokenInOptions(testToken)
      
      // Mock network error
      await extensionTest.page.setRequestInterception(true)
      extensionTest.page.on('request', (request) => {
        if (request.url().includes('api.cloudflare.com')) {
          request.abort()
        } else {
          request.continue()
        }
      })
      
      await extensionTest.hoverAsnElement('AS13335')
      await extensionTest.waitForTooltip()
      
      const tooltipContent = await extensionTest.getTooltipContent()
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent).toContain('No data')
    })

    it('should handle malformed API responses', async () => {
      const testToken = process.env.CLOUDFLARE_API_TOKEN || 'test-token-12345'
      
      await extensionTest.setTokenInOptions(testToken)
      
      // Mock malformed response
      await extensionTest.page.setRequestInterception(true)
      extensionTest.page.on('request', (request) => {
        if (request.url().includes('api.cloudflare.com')) {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: '{"invalid": "response"}'
          })
        } else {
          request.continue()
        }
      })
      
      await extensionTest.hoverAsnElement('AS13335')
      await extensionTest.waitForTooltip()
      
      const tooltipContent = await extensionTest.getTooltipContent()
      expect(tooltipContent).toBeTruthy()
      expect(tooltipContent).toContain('No data')
    })
  })
})
