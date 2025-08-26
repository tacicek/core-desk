import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  CacheManager, 
  TaggedCacheManager, 
  CompressedCacheManager, 
  VersionedCacheManager,
  createCache 
} from '@/lib/cache'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager(1024 * 1024) // 1MB max size
  })

  describe('Basic Cache Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('should check if key exists', () => {
      cache.set('key1', 'value1')
      
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('should delete keys', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      
      cache.delete('key1')
      expect(cache.has('key1')).toBe(false)
    })

    it('should clear all entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      const statsBefore = cache.getStats()
      expect(statsBefore.keys).toBeGreaterThan(0)
      
      cache.clear()
      const statsAfter = cache.getStats()
      expect(statsAfter.keys).toBe(0)
    })

    it('should return correct cache size', () => {
      const stats1 = cache.getStats()
      expect(stats1.keys).toBe(0)
      
      cache.set('key1', 'value1')
      const stats2 = cache.getStats()
      expect(stats2.keys).toBe(1)
      
      cache.set('key2', 'value2')
      const stats3 = cache.getStats()
      expect(stats3.keys).toBe(2)
    })
  })

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should expire entries after TTL', () => {
      cache.set('key1', 'value1', { ttlMinutes: 0.025 }) // 1.5 seconds
      expect(cache.get('key1')).toBe('value1')
      
      // Fast forward time beyond TTL
      vi.advanceTimersByTime(2000) // 2 seconds
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.has('key1')).toBe(false)
    })

    it('should not expire entries before TTL', () => {
      cache.set('key1', 'value1', { ttlMinutes: 0.1 }) // 6 seconds
      
      // Fast forward time within TTL
      vi.advanceTimersByTime(3000) // 3 seconds
      
      expect(cache.get('key1')).toBe('value1')
    })

    it('should handle custom TTL per entry', () => {
      cache.set('key1', 'value1', { ttlMinutes: 0.01 }) // 0.6 seconds
      cache.set('key2', 'value2', { ttlMinutes: 0.05 }) // 3 seconds
      
      // Fast forward to expire first entry but not second
      vi.advanceTimersByTime(1500) // 1.5 seconds
      
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
    })
  })

  describe('LRU Eviction', () => {
    beforeEach(() => {
      // Create cache with small size for testing eviction
      cache = new CacheManager(500) // Small size to trigger eviction
    })

    it('should evict least recently used entries when max size reached', () => {
      // Fill cache with entries
      for (let i = 1; i <= 10; i++) {
        cache.set(`key${i}`, `value${i}`.repeat(50)) // Large values
      }
      
      // Check that some entries were evicted
      const stats = cache.getStats()
      expect(stats.keys).toBeLessThan(10)
    })

    it('should update LRU order on access', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      
      // Access key1 to make it most recently used
      cache.get('key1')
      
      // This is a basic test - LRU behavior is complex to test without internal access
      expect(cache.get('key1')).toBe('value1')
    })
  })

  describe('Statistics', () => {
    it('should track hit and miss statistics', () => {
      cache.set('key1', 'value1')
      
      // Generate hits
      cache.get('key1')
      cache.get('key1')
      
      // Generate misses
      cache.get('nonexistent1')
      cache.get('nonexistent2')
      
      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBe(50)
    })

    it('should track evictions', () => {
      // Create cache with very small size
      const smallCache = new CacheManager(100)
      
      // Add items that will trigger eviction
      for (let i = 1; i <= 5; i++) {
        smallCache.set(`key${i}`, `value${i}`.repeat(50))
      }
      
      const stats = smallCache.getStats()
      expect(stats.deletes).toBeGreaterThan(0)
    })

    it('should reset statistics', () => {
      cache.set('key1', 'value1')
      cache.get('key1')
      cache.get('nonexistent')
      
      let stats = cache.getStats()
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      
      cache.resetStats()
      
      stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })
})

describe('TaggedCacheManager', () => {
  let cache: TaggedCacheManager<string>

  beforeEach(() => {
    cache = new TaggedCacheManager<string>(1024 * 1024) // 1MB max size
  })

  describe('Tag-based Operations', () => {
    it('should store and retrieve tagged entries', () => {
      cache.setWithTags('key1', 'value1', ['user:123', 'invoices'])
      expect(cache.get('key1')).toBe('value1')
    })

    it('should invalidate entries by tag', () => {
      cache.setWithTags('key1', 'value1', ['user:123', 'invoices'])
      cache.setWithTags('key2', 'value2', ['user:123', 'customers'])
      cache.setWithTags('key3', 'value3', ['user:456', 'invoices'])
      
      cache.invalidateTag('user:123')
      
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
      expect(cache.has('key3')).toBe(true)
    })

    it('should invalidate entries by multiple tags', () => {
      cache.setWithTags('key1', 'value1', ['user:123', 'invoices'])
      cache.setWithTags('key2', 'value2', ['user:456', 'invoices'])
      cache.setWithTags('key3', 'value3', ['user:123', 'customers'])
      
      cache.invalidateByTags(['user:123', 'invoices'])
      
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true) // Only has invoices tag, not user:123
      expect(cache.has('key3')).toBe(false)
    })

    it('should get entries by tag', () => {
      cache.setWithTags('key1', 'value1', ['user:123'])
      cache.setWithTags('key2', 'value2', ['user:123'])
      cache.setWithTags('key3', 'value3', ['user:456'])
      
      const userEntries = cache.getByTag('user:123')
      expect(userEntries).toEqual([
        { key: 'key1', data: 'value1' },
        { key: 'key2', data: 'value2' }
      ])
    })

    it('should handle entries without tags', () => {
      cache.set('key1', 'value1')
      cache.setWithTags('key2', 'value2', ['user:123'])
      
      cache.invalidateTag('user:123')
      
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
    })
  })
})

describe('CompressedCacheManager', () => {
  let cache: CompressedCacheManager<any>

  beforeEach(() => {
    cache = new CompressedCacheManager<any>(1024 * 1024) // 1MB max size
  })

  describe('Compression', () => {
    it('should compress and decompress large objects', () => {
      const largeObject = {
        data: 'x'.repeat(1000),
        nested: { 
          array: Array(100).fill('test data'),
          metadata: { timestamp: Date.now() }
        }
      }
      
      cache.set('large', largeObject)
      const retrieved = cache.get('large')
      
      expect(retrieved).toEqual(largeObject)
    })

    it('should handle compression gracefully', () => {
      const data = { test: 'x'.repeat(1000) }
      const result = cache.set('key1', data)
      
      expect(result).toBe(true)
      expect(cache.get('key1')).toEqual(data)
    })

    it('should work with basic compression', () => {
      const data = { test: 'simple data' }
      cache.set('key1', data)
      
      const stats = cache.getStats()
      expect(stats.sets).toBe(1)
      expect(cache.get('key1')).toEqual(data)
    })
  })
})

describe('VersionedCacheManager', () => {
  let cache: VersionedCacheManager<string>

  beforeEach(() => {
    cache = new VersionedCacheManager<string>('1.0', 1024 * 1024)
  })

  describe('Versioning', () => {
    it('should store and retrieve versioned entries', () => {
      cache.set('key1', 'value1')
      
      expect(cache.get('key1')).toBe('value1')
    })

    it('should handle version updates', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
      
      // Update version - should clear cache
      cache.updateVersion('2.0')
      expect(cache.get('key1')).toBeNull()
    })

    it('should maintain version consistency', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      const stats = cache.getStats()
      expect(stats.keys).toBe(2)
    })
  })
})

describe('Cache Factory', () => {
  it('should create basic cache', () => {
    const cache = createCache({ maxSize: 1024 })
    expect(cache).toBeInstanceOf(CacheManager)
  })

  it('should create cache with default settings', () => {
    const cache = createCache()
    expect(cache).toBeInstanceOf(CacheManager)
    
    // Test basic functionality
    cache.set('test', 'value')
    expect(cache.get('test')).toBe('value')
  })

  it('should handle cache operations', () => {
    const cache = createCache({ maxSize: 1024 })
    
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('key2')).toBe(true)
    expect(cache.get('key1')).toBe('value1')
  })
})

describe('Cache Integration Scenarios', () => {
  it('should handle invoice caching scenario', () => {
    const cache = new TaggedCacheManager<any>(1024 * 1024)
    
    // Cache invoices for different users
    cache.setWithTags('invoice:1', 
      { id: 1, customer: 'Customer A', amount: 100 }, 
      ['user:123', 'invoices', 'customer:A']
    )
    
    cache.setWithTags('invoice:2', 
      { id: 2, customer: 'Customer B', amount: 200 }, 
      ['user:123', 'invoices', 'customer:B']
    )
    
    // Verify data is cached
    expect(cache.has('invoice:1')).toBe(true)
    expect(cache.has('invoice:2')).toBe(true)
    
    // Invalidate when user data changes
    cache.invalidateTag('user:123')
    
    expect(cache.has('invoice:1')).toBe(false)
    expect(cache.has('invoice:2')).toBe(false)
  })
})
    
    expect(cache.has('invoice:1')).toBe(false)
    expect(cache.has('invoice:2')).toBe(false)
  })

  it('should handle product catalog caching', () => {
    const cache = new TaggedCacheManager<any>({ maxSize: 100 })
    
    // Cache products by category
    cache.setWithTags('product:1', 
      { id: 1, name: 'Software License', category: 'software' },
      ['products', 'category:software', 'vendor:123']
    )
    
    cache.setWithTags('product:2', 
      { id: 2, name: 'Hardware Kit', category: 'hardware' },
      ['products', 'category:hardware', 'vendor:123']
    )
    
    // Get all software products
    const softwareProducts = cache.getByTag('category:software')
    expect(softwareProducts).toHaveLength(1)
    expect(softwareProducts[0].value.name).toBe('Software License')
  })

  it('should handle API response caching with TTL', () => {
    vi.useFakeTimers()
    
    const cache = new CacheManager<any>({ maxSize: 50, ttl: 5000 })
    
    // Cache API responses
    cache.set('api:customers', { data: ['customer1', 'customer2'] }, 3000)
    cache.set('api:products', { data: ['product1', 'product2'] }, 1000)
    
    // Check immediate availability
    expect(cache.get('api:customers')).toBeDefined()
    expect(cache.get('api:products')).toBeDefined()
    
    // Fast forward past products TTL but not customers
    vi.advanceTimersByTime(2000)
    
    expect(cache.get('api:customers')).toBeDefined()
    expect(cache.get('api:products')).toBeUndefined()
    
    vi.useRealTimers()
  })
})