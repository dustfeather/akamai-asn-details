import puppeteer from 'puppeteer'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'path'

export class ExtensionTestHelper {
  constructor() {
    this.browser = null
    this.page = null
    this.extensionId = null
  }

  async launchBrowser() {
    const extensionPath = path.resolve(process.cwd(), 'extension')
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      defaultViewport: { width: 1280, height: 720 }
    })

    // Get extension ID
    const targets = await this.browser.targets()
    const extensionTarget = targets.find(target => 
      target.type() === 'background_page' && 
      target.url().includes('chrome-extension://')
    )
    
    if (extensionTarget) {
      const url = extensionTarget.url()
      this.extensionId = url.match(/chrome-extension:\/\/([^\/]+)/)[1]
    }

    this.page = await this.browser.newPage()
    return this.page
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
      this.extensionId = null
    }
  }

  getExtensionUrl(path = '') {
    if (!this.extensionId) {
      throw new Error('Extension not loaded or ID not found')
    }
    return `chrome-extension://${this.extensionId}/${path}`
  }

  async navigateToOptions() {
    const optionsUrl = this.getExtensionUrl('options/options.html')
    await this.page.goto(optionsUrl, { waitUntil: 'networkidle0' })
  }

  async navigateToTestPage() {
    // Create a simple test page with ASN elements
    const testPageHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>ASN Test Page</title>
        <style>
          .asn-cell { padding: 10px; margin: 5px; border: 1px solid #ccc; cursor: pointer; }
          .asn-cell:hover { background-color: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>ASN Test Page</h1>
        <div class="asn-cell">AS13335</div>
        <div class="asn-cell">AS15169</div>
        <div class="asn-cell">AS32934</div>
        <div class="asn-cell">AS7922</div>
      </body>
      </html>
    `
    
    await this.page.setContent(testPageHtml)
  }

  async mockCloudflareAPI() {
    await this.page.setRequestInterception(true)
    
    this.page.on('request', (request) => {
      const url = request.url()
      
      if (url.includes('api.cloudflare.com/client/v4/radar')) {
        // Mock successful API response
        request.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            result: {
              human: 0.755,
              bot: 0.245
            }
          })
        })
      } else {
        request.continue()
      }
    })
  }

  async mockCloudflareAPIError(status = 401) {
    await this.page.setRequestInterception(true)
    
    this.page.on('request', (request) => {
      const url = request.url()
      
      if (url.includes('api.cloudflare.com/client/v4/radar')) {
        request.respond({
          status: status,
          contentType: 'application/json',
          body: JSON.stringify({
            errors: [{ message: 'Unauthorized' }]
          })
        })
      } else {
        request.continue()
      }
    })
  }

  async setTokenInOptions(token) {
    await this.navigateToOptions()
    
    // Fill in the token field
    await this.page.type('#token', token)
    
    // Click save button
    await this.page.click('#save')
    
    // Wait for save confirmation
    await this.page.waitForSelector('#status', { visible: true })
    
    const statusText = await this.page.textContent('#status')
    expect(statusText).toBe('Saved')
  }

  async clearTokenInOptions() {
    await this.navigateToOptions()
    
    // Clear the token field
    await this.page.click('#token', { clickCount: 3 })
    await this.page.keyboard.press('Delete')
    
    // Click save button
    await this.page.click('#save')
    
    // Wait for save confirmation
    await this.page.waitForSelector('#status', { visible: true })
  }

  async hoverAsnElement(asnText) {
    await this.navigateToTestPage()
    
    // Find and hover over the ASN element
    const asnElement = await this.page.$(`text=${asnText}`)
    expect(asnElement).toBeTruthy()
    
    await asnElement.hover()
    
    // Wait a bit for tooltip to appear
    await this.page.waitForTimeout(300)
  }

  async getTooltipContent() {
    // Look for the tooltip element
    const tooltip = await this.page.$('#wsar-tooltip-root')
    if (!tooltip) return null
    
    const shadowRoot = await tooltip.evaluateHandle(el => el.shadowRoot)
    const tooltipContent = await shadowRoot.$('.tip')
    
    if (!tooltipContent) return null
    
    return await tooltipContent.textContent()
  }

  async waitForTooltip() {
    await this.page.waitForSelector('#wsar-tooltip-root', { timeout: 5000 })
  }

  async getExtensionManifest() {
    const manifestUrl = this.getExtensionUrl('manifest.json')
    const response = await this.page.goto(manifestUrl)
    return await response.json()
  }
}

// Helper function to create a test instance
export function createExtensionTest() {
  return new ExtensionTestHelper()
}
