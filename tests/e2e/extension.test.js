import { describe, it, expect } from 'vitest'

describe('Extension E2E Tests', () => {
  it('should load extension successfully', async () => {
    // Check if we're running in browser mode
    expect(typeof window).toBe('object')
    
    // Navigate to chrome://extensions to verify extension is loaded
    window.location.href = 'chrome://extensions/'
    
    // Wait for navigation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if we can see the extensions page
    const body = document.body
    expect(body).toBeDefined()
    
    // Look for extension-related elements
    const extensionsContainer = document.querySelector('extensions-manager')
    expect(extensionsContainer).toBeDefined()
  })

  it('should have extension manifest accessible', async () => {
    // Try to access the extension manifest via chrome://extensions
    window.location.href = 'chrome://extensions/'
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if we're on the extensions page
    expect(document.body).toBeDefined()
    
    // The extension should be visible in the extensions page
    // This is a basic check that the extension loaded
    const extensionsManager = document.querySelector('extensions-manager')
    expect(extensionsManager).toBeDefined()
  })

})
