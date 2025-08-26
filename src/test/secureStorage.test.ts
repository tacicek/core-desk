import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SecureApiKeyManager } from '@/lib/secureStorage'
import { createMockUser, createSuccessResponse, createErrorResponse, mockLocalStorage } from '@/test/utils'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}

// Mock crypto subtle API
const mockCryptoSubtle = {
  generateKey: vi.fn(),
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  importKey: vi.fn(),
  exportKey: vi.fn()
}

describe('SecureApiKeyManager', () => {
  let secureManager: SecureApiKeyManager
  let mockUser: any
  let originalCrypto: any
  let originalLocalStorage: any

  beforeEach(() => {
    // Setup mocks
    mockUser = createMockUser()
    originalCrypto = global.crypto
    originalLocalStorage = global.localStorage

    // Mock crypto API
    global.crypto = {
      ...global.crypto,
      subtle: mockCryptoSubtle,
      getRandomValues: vi.fn((arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      })
    }

    // Mock localStorage
    global.localStorage = mockLocalStorage()

    // Setup default mock implementations
    mockCryptoSubtle.generateKey.mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM' }
    })

    mockCryptoSubtle.encrypt.mockResolvedValue(new ArrayBuffer(32))
    mockCryptoSubtle.decrypt.mockResolvedValue(new TextEncoder().encode('decrypted-key'))
    mockCryptoSubtle.exportKey.mockResolvedValue(new ArrayBuffer(32))
    mockCryptoSubtle.importKey.mockResolvedValue({
      type: 'secret',
      algorithm: { name: 'AES-GCM' }
    })

    mockSupabaseClient.auth.getUser.mockResolvedValue(createSuccessResponse(mockUser))

    secureManager = new SecureApiKeyManager(mockSupabaseClient as any)
  })

  afterEach(() => {
    global.crypto = originalCrypto
    global.localStorage = originalLocalStorage
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with Supabase client', () => {
      expect(secureManager).toBeDefined()
      expect(secureManager.isInitialized()).toBe(false)
    })

    it('should initialize successfully with user', async () => {
      await secureManager.initialize()
      
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
      expect(secureManager.isInitialized()).toBe(true)
    })

    it('should handle initialization failure when no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(createSuccessResponse(null))

      await expect(secureManager.initialize()).rejects.toThrow('User not authenticated')
      expect(secureManager.isInitialized()).toBe(false)
    })

    it('should handle Supabase auth error during initialization', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue(
        createErrorResponse('Auth error', 'AUTH_ERROR')
      )

      await expect(secureManager.initialize()).rejects.toThrow('Auth error')
    })
  })

  describe('Key Generation and Encryption', () => {
    beforeEach(async () => {
      await secureManager.initialize()
    })

    it('should generate and store master key', async () => {
      await secureManager.store('openai', 'test-api-key')

      expect(mockCryptoSubtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )
    })

    it('should encrypt API key before storage', async () => {
      await secureManager.store('openai', 'test-api-key')

      expect(mockCryptoSubtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM' }),
        expect.any(Object),
        expect.any(Uint8Array)
      )
    })

    it('should store encrypted data in user metadata', async () => {
      await secureManager.store('openai', 'test-api-key')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        metadata: expect.objectContaining({
          encrypted_api_keys: expect.any(Object)
        })
      })
    })
  })

  describe('Key Retrieval and Decryption', () => {
    beforeEach(async () => {
      await secureManager.initialize()
      // Store a key first
      await secureManager.store('openai', 'test-api-key')
    })

    it('should decrypt and retrieve stored API key', async () => {
      const retrievedKey = await secureManager.retrieve('openai')

      expect(mockCryptoSubtle.decrypt).toHaveBeenCalled()
      expect(retrievedKey).toBe('decrypted-key')
    })

    it('should return null for non-existent keys', async () => {
      const retrievedKey = await secureManager.retrieve('nonexistent')
      expect(retrievedKey).toBeNull()
    })

    it('should handle decryption errors gracefully', async () => {
      mockCryptoSubtle.decrypt.mockRejectedValue(new Error('Decryption failed'))

      const retrievedKey = await secureManager.retrieve('openai')
      expect(retrievedKey).toBeNull()
    })
  })

  describe('Key Management Operations', () => {
    beforeEach(async () => {
      await secureManager.initialize()
    })

    it('should list all stored API key types', async () => {
      await secureManager.store('openai', 'key1')
      await secureManager.store('resend', 'key2')

      const keys = await secureManager.listKeys()
      expect(keys).toEqual(['openai', 'resend'])
    })

    it('should check if specific key exists', async () => {
      await secureManager.store('openai', 'test-key')

      const exists = await secureManager.hasKey('openai')
      const notExists = await secureManager.hasKey('nonexistent')

      expect(exists).toBe(true)
      expect(notExists).toBe(false)
    })

    it('should remove stored API keys', async () => {
      await secureManager.store('openai', 'test-key')
      expect(await secureManager.hasKey('openai')).toBe(true)

      await secureManager.remove('openai')
      expect(await secureManager.hasKey('openai')).toBe(false)
    })

    it('should clear all stored keys', async () => {
      await secureManager.store('openai', 'key1')
      await secureManager.store('resend', 'key2')

      await secureManager.clearAll()

      const keys = await secureManager.listKeys()
      expect(keys).toEqual([])
    })
  })

  describe('Migration from localStorage', () => {
    beforeEach(async () => {
      // Setup localStorage with old keys
      global.localStorage.setItem('openai_api_key', 'old-openai-key')
      global.localStorage.setItem('resend_api_key', 'old-resend-key')
      global.localStorage.setItem('other_data', 'not-a-key')

      await secureManager.initialize()
    })

    it('should detect keys that need migration', async () => {
      const status = await secureManager.getMigrationStatus()

      expect(status.needsMigration).toBe(true)
      expect(status.keysToMigrate).toEqual(['openai_api_key', 'resend_api_key'])
      expect(status.totalKeys).toBe(2)
    })

    it('should migrate keys from localStorage to secure storage', async () => {
      await secureManager.migrateFromLocalStorage()

      // Verify keys were encrypted and stored
      expect(mockCryptoSubtle.encrypt).toHaveBeenCalledTimes(2)
      
      // Verify localStorage keys were removed
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('openai_api_key')
      expect(global.localStorage.removeItem).toHaveBeenCalledWith('resend_api_key')
    })

    it('should handle partial migration failures gracefully', async () => {
      // Make one encryption fail
      mockCryptoSubtle.encrypt
        .mockResolvedValueOnce(new ArrayBuffer(32))
        .mockRejectedValueOnce(new Error('Encryption failed'))

      const result = await secureManager.migrateFromLocalStorage()

      expect(result.successful).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('should not migrate if no legacy keys exist', async () => {
      global.localStorage.clear()
      
      const result = await secureManager.migrateFromLocalStorage()

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(0)
      expect(mockCryptoSubtle.encrypt).not.toHaveBeenCalled()
    })
  })

  describe('Security Features', () => {
    beforeEach(async () => {
      await secureManager.initialize()
    })

    it('should use unique initialization vectors for each encryption', async () => {
      await secureManager.store('key1', 'value1')
      await secureManager.store('key2', 'value2')

      // Check that getRandomValues was called for IVs
      expect(global.crypto.getRandomValues).toHaveBeenCalledTimes(2)
    })

    it('should handle encryption failures gracefully', async () => {
      mockCryptoSubtle.encrypt.mockRejectedValue(new Error('Encryption failed'))

      await expect(secureManager.store('openai', 'test-key'))
        .rejects.toThrow('Failed to encrypt API key')
    })

    it('should validate key types', async () => {
      // Test with valid key type
      await expect(secureManager.store('openai', 'test-key')).resolves.not.toThrow()
      
      // Test with invalid key type
      await expect(secureManager.store('', 'test-key'))
        .rejects.toThrow('Invalid key type')
    })

    it('should validate API key values', async () => {
      // Test with valid key
      await expect(secureManager.store('openai', 'sk-123456')).resolves.not.toThrow()
      
      // Test with empty key
      await expect(secureManager.store('openai', ''))
        .rejects.toThrow('Invalid API key')
      
      // Test with null key
      await expect(secureManager.store('openai', null as any))
        .rejects.toThrow('Invalid API key')
    })
  })

  describe('Error Handling', () => {
    it('should handle operations before initialization', async () => {
      const uninitializedManager = new SecureApiKeyManager(mockSupabaseClient as any)

      await expect(uninitializedManager.store('openai', 'test'))
        .rejects.toThrow('SecureApiKeyManager not initialized')
    })

    it('should handle Supabase update errors', async () => {
      await secureManager.initialize()
      
      // Mock Supabase update failure
      mockSupabaseClient.from().update().eq.mockResolvedValue({
        error: { message: 'Database error' }
      })

      await expect(secureManager.store('openai', 'test-key'))
        .rejects.toThrow('Failed to store encrypted key')
    })

    it('should handle corrupted stored data', async () => {
      await secureManager.initialize()
      
      // Store valid data first
      await secureManager.store('openai', 'test-key')
      
      // Corrupt the stored data by making decrypt fail
      mockCryptoSubtle.decrypt.mockRejectedValue(new Error('Invalid data'))
      
      const result = await secureManager.retrieve('openai')
      expect(result).toBeNull()
    })
  })

  describe('Performance and Optimization', () => {
    beforeEach(async () => {
      await secureManager.initialize()
    })

    it('should reuse master key for multiple operations', async () => {
      await secureManager.store('key1', 'value1')
      await secureManager.store('key2', 'value2')
      await secureManager.store('key3', 'value3')

      // Master key should only be generated once
      expect(mockCryptoSubtle.generateKey).toHaveBeenCalledTimes(1)
    })

    it('should handle concurrent operations safely', async () => {
      const promises = [
        secureManager.store('key1', 'value1'),
        secureManager.store('key2', 'value2'),
        secureManager.store('key3', 'value3')
      ]

      await expect(Promise.all(promises)).resolves.not.toThrow()
    })
  })

  describe('Integration with Supabase', () => {
    it('should handle user metadata updates correctly', async () => {
      await secureManager.initialize()
      await secureManager.store('openai', 'test-key')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_profiles')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            encrypted_api_keys: expect.any(Object),
            security_version: expect.any(String),
            encryption_algorithm: 'AES-GCM-256'
          })
        })
      )
    })

    it('should include proper security metadata', async () => {
      await secureManager.initialize()
      await secureManager.store('openai', 'test-key')

      const updateCall = mockSupabaseClient.from().update.mock.calls[0][0]
      expect(updateCall.metadata).toMatchObject({
        encryption_algorithm: 'AES-GCM-256',
        security_version: expect.stringMatching(/^\d+\.\d+\.\d+$/)
      })
    })
  })
})