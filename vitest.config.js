import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.test.js'],
    exclude: ['node_modules/**', 'extension/vendor/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'extension/vendor/**',
        'tests/**',
        '**/*.test.js'
      ]
    },
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'puppeteer',
      headless: true
    },
    env: {
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'test-token'
    }
  }
})
