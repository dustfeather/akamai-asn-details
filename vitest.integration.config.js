import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // Use Node.js environment for integration tests
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 30000, // Longer timeout for API calls
    env: {
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'test-token'
    }
  }
})
