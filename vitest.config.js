import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { config } from 'dotenv'

// Load environment variables from .env file
config()

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        enableJavaScriptEvaluation: true
      }
    },
    include: ['**/*.test.js'],
    exclude: ['node_modules/**', 'extension/vendor/**', 'tests/integration/**'],
    // Override environment for integration tests
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'extension/vendor/**',
        'tests/**',
        '**/*.test.js'
      ]
    },
    browser: {
      provider: playwright({
        launchOptions: {
          headless: false, // Set to true for CI/CD
          args: [
            `--disable-extensions-except=${process.cwd()}/extension`,
            `--load-extension=${process.cwd()}/extension`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
        },
      }),
      instances: [
        {
          browser: 'chromium',
          launch: {
            headless: false, // Set to true for CI/CD
            args: [
              `--disable-extensions-except=${process.cwd()}/extension`,
              `--load-extension=${process.cwd()}/extension`,
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor'
            ],
          },
        },
      ],
    },
    env: {
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'test-token'
    }
  }
})
