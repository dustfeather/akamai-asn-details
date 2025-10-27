import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setupChromeMocks, resetChromeMocks } from '../helpers/mocks.js'

// Import the storage module functions by evaluating the file content
let storageModule

describe('Storage Module', () => {
  beforeEach(async () => {
    const mocks = setupChromeMocks()
    
    // Load the storage module by evaluating the file
    const fs = await import('fs')
    const path = await import('path')
    const storageCode = fs.readFileSync(path.join(process.cwd(), 'extension/common/storage.js'), 'utf8')
    
    // Evaluate the storage module code
    eval(storageCode)
    
    // Get the exposed functions
    storageModule = globalThis.wsarStorage
  })

  afterEach(() => {
    resetChromeMocks()
    delete globalThis.wsarStorage
  })

  describe('getSetting', () => {
    it('should return stored value when key exists', async () => {
      // Set a value in storage
      await storageModule.setSetting('testKey', 'testValue')
      
      const result = await storageModule.getSetting('testKey', 'defaultValue')
      expect(result).toBe('testValue')
    })

    it('should return default value when key does not exist', async () => {
      const result = await storageModule.getSetting('nonexistentKey', 'defaultValue')
      expect(result).toBe('defaultValue')
    })

    it('should return default value when storage is empty', async () => {
      const result = await storageModule.getSetting('anyKey', 'fallback')
      expect(result).toBe('fallback')
    })
  })

  describe('setSetting', () => {
    it('should store a value and retrieve it', async () => {
      await storageModule.setSetting('newKey', 'newValue')
      
      const result = await storageModule.getSetting('newKey', 'default')
      expect(result).toBe('newValue')
    })

    it('should overwrite existing value', async () => {
      await storageModule.setSetting('overwriteKey', 'firstValue')
      await storageModule.setSetting('overwriteKey', 'secondValue')
      
      const result = await storageModule.getSetting('overwriteKey', 'default')
      expect(result).toBe('secondValue')
    })
  })

  describe('getFresh', () => {
    it('should return cached data when within TTL', async () => {
      const testData = { humanPct: 75, botPct: 25 }
      const cacheKey = 'test:asn:13335'
      
      // Set data with current timestamp
      await storageModule.setWithTimestamp(cacheKey, testData)
      
      // Should return data immediately (within TTL)
      const result = await storageModule.getFresh(cacheKey, 60000) // 1 minute TTL
      expect(result).toEqual(testData)
    })

    it('should return null when data is expired', async () => {
      const testData = { humanPct: 75, botPct: 25 }
      const cacheKey = 'test:asn:13335'
      
      // Set data with old timestamp
      await storageModule.setCachedRaw(cacheKey, {
        data: testData,
        fetchedAt: Date.now() - 120000 // 2 minutes ago
      })
      
      // Should return null (expired)
      const result = await storageModule.getFresh(cacheKey, 60000) // 1 minute TTL
      expect(result).toBeNull()
    })

    it('should return null when no cached data exists', async () => {
      const result = await storageModule.getFresh('nonexistent:key', 60000)
      expect(result).toBeNull()
    })

    it('should return null when cached data is invalid format', async () => {
      const cacheKey = 'test:invalid'
      
      // Set invalid data format
      await storageModule.setCachedRaw(cacheKey, 'invalid-data')
      
      const result = await storageModule.getFresh(cacheKey, 60000)
      expect(result).toBeNull()
    })
  })

  describe('setWithTimestamp', () => {
    it('should store data with current timestamp', async () => {
      const testData = { humanPct: 80, botPct: 20 }
      const cacheKey = 'test:timestamp'
      
      await storageModule.setWithTimestamp(cacheKey, testData)
      
      // Verify the data structure
      const stored = await storageModule.getCachedRaw(cacheKey)
      expect(stored).toBeDefined()
      expect(stored.data).toEqual(testData)
      expect(typeof stored.fetchedAt).toBe('number')
      expect(stored.fetchedAt).toBeCloseTo(Date.now(), -2) // Within 100ms
    })

    it('should overwrite existing timestamped data', async () => {
      const firstData = { humanPct: 70, botPct: 30 }
      const secondData = { humanPct: 90, botPct: 10 }
      const cacheKey = 'test:overwrite'
      
      await storageModule.setWithTimestamp(cacheKey, firstData)
      await storageModule.setWithTimestamp(cacheKey, secondData)
      
      const stored = await storageModule.getCachedRaw(cacheKey)
      expect(stored.data).toEqual(secondData)
    })
  })

  describe('getCachedRaw', () => {
    it('should return stored data exactly as stored', async () => {
      const testData = { custom: 'data', nested: { value: 123 } }
      const cacheKey = 'test:raw'
      
      await storageModule.setCachedRaw(cacheKey, testData)
      
      const result = await storageModule.getCachedRaw(cacheKey)
      expect(result).toEqual(testData)
    })

    it('should return null for non-existent key', async () => {
      const result = await storageModule.getCachedRaw('nonexistent:raw')
      expect(result).toBeNull()
    })
  })

  describe('setCachedRaw', () => {
    it('should store any data type', async () => {
      const testCases = [
        { key: 'string', value: 'test string' },
        { key: 'number', value: 42 },
        { key: 'boolean', value: true },
        { key: 'object', value: { nested: 'object' } },
        { key: 'array', value: [1, 2, 3] },
        { key: 'null', value: null }
      ]

      for (const testCase of testCases) {
        await storageModule.setCachedRaw(testCase.key, testCase.value)
        const result = await storageModule.getCachedRaw(testCase.key)
        expect(result).toEqual(testCase.value)
      }
    })
  })

  describe('TTL edge cases', () => {
    it('should handle zero TTL', async () => {
      const testData = { humanPct: 50, botPct: 50 }
      const cacheKey = 'test:zero-ttl'
      
      await storageModule.setWithTimestamp(cacheKey, testData)
      
      // Zero TTL should always return null
      const result = await storageModule.getFresh(cacheKey, 0)
      expect(result).toBeNull()
    })

    it('should handle very large TTL', async () => {
      const testData = { humanPct: 60, botPct: 40 }
      const cacheKey = 'test:large-ttl'
      
      await storageModule.setWithTimestamp(cacheKey, testData)
      
      // Very large TTL should return data
      const result = await storageModule.getFresh(cacheKey, Number.MAX_SAFE_INTEGER)
      expect(result).toEqual(testData)
    })
  })
})
