import { useErrorReporting } from '@/components/ErrorBoundary';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: string;
  tags?: string[];
  size?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
  size: number;
  maxSize: number;
}

interface CacheOptions {
  ttlMinutes?: number;
  version?: string;
  tags?: string[];
  compress?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0,
    size: 0,
    maxSize: 10 * 1024 * 1024 // 10MB default
  };
  private cleanupInterval: NodeJS.Timeout | null = null;
  private reportError: ((error: Error, context?: Record<string, any>) => Promise<string | null>) | null = null;

  constructor(maxSize = 10 * 1024 * 1024) { // 10MB default
    this.stats.maxSize = maxSize;
    this.startCleanupInterval();
    this.initErrorReporting();
  }

  private initErrorReporting() {
    // Initialize error reporting if available
    try {
      const { useErrorReporting } = require('@/components/ErrorBoundary');
      // Note: This is a simplified approach. In a real scenario, you might want to inject this dependency
    } catch (error) {
      console.warn('Error reporting not available in cache manager');
    }
  }

  private startCleanupInterval() {
    // Clean up expired items every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private calculateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      // Fallback size estimation
      return JSON.stringify(data).length * 2; // Rough estimate in bytes
    }
  }

  private compress(data: any): string {
    try {
      // Simple compression using JSON stringify with reduced precision
      return JSON.stringify(data, (key, value) => {
        if (typeof value === 'number' && !Number.isInteger(value)) {
          return Math.round(value * 100) / 100; // Round to 2 decimal places
        }
        return value;
      });
    } catch {
      return JSON.stringify(data);
    }
  }

  private decompress(compressedData: string): any {
    try {
      return JSON.parse(compressedData);
    } catch (error) {
      console.error('Failed to decompress cache data:', error);
      return null;
    }
  }

  private evictLRU() {
    // Simple LRU eviction - remove oldest items first
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove 25% of items to make room
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove && entries.length > 0; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
      this.stats.deletes++;
    }
  }

  private checkSizeLimit() {
    if (this.stats.size > this.stats.maxSize) {
      this.evictLRU();
      this.updateSize();
    }
  }

  private updateSize() {
    let totalSize = 0;
    for (const item of this.cache.values()) {
      totalSize += item.size || 0;
    }
    this.stats.size = totalSize;
  }

  /**
   * Set an item in the cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): boolean {
    try {
      const {
        ttlMinutes = 5,
        version = '1.0',
        tags = [],
        compress = false,
        priority = 'normal'
      } = options;

      const size = this.calculateSize(data);
      const processedData = compress ? this.compress(data) : data;

      const item: CacheItem<T> = {
        data: processedData,
        timestamp: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
        version,
        tags,
        size
      };

      this.cache.set(key, item);
      this.stats.sets++;
      this.stats.size += size;

      this.checkSizeLimit();
      return true;

    } catch (error) {
      console.error('Cache set error:', error);
      this.reportError?.(error as Error, { context: 'cache.set', key });
      return false;
    }
  }

  /**
   * Get an item from the cache
   */
  get<T>(key: string, options: { version?: string; decompress?: boolean } = {}): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.deletes++;
        return null;
      }

      // Check version compatibility
      if (options.version && item.version !== options.version) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.deletes++;
        return null;
      }

      // Update timestamp for LRU
      item.timestamp = Date.now();
      
      this.stats.hits++;
      
      // Decompress if needed
      if (options.decompress && typeof item.data === 'string') {
        return this.decompress(item.data);
      }
      
      return item.data;

    } catch (error) {
      console.error('Cache get error:', error);
      this.reportError?.(error as Error, { context: 'cache.get', key });
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Check if an item exists in cache and is not expired
   */
  has(key: string, options: { version?: string } = {}): boolean {
    const item = this.cache.get(key);
    
    if (!item) return false;
    
    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.deletes++;
      return false;
    }

    // Check version compatibility
    if (options.version && item.version !== options.version) {
      return false;
    }

    return true;
  }

  /**
   * Delete an item from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateSize();
    }
    return deleted;
  }

  /**
   * Invalidate cache items by pattern
   */
  invalidate(pattern: string | RegExp): number {
    let deleted = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    this.stats.deletes += deleted;
    this.updateSize();
    return deleted;
  }

  /**
   * Invalidate cache items by tags
   */
  invalidateByTags(tags: string[]): number {
    let deleted = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.tags && item.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
        deleted++;
      }
    }
    
    this.stats.deletes += deleted;
    this.updateSize();
    return deleted;
  }

  /**
   * Clear all cache items
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.clears++;
    this.stats.deletes += size;
    this.stats.size = 0;
  }

  /**
   * Clean up expired items
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.stats.deletes += cleaned;
      this.updateSize();
      console.log(`Cache cleanup: removed ${cleaned} expired items`);
    }
    
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: number; keys: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      keys: this.cache.size
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      size: this.stats.size,
      maxSize: this.stats.maxSize
    };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size in bytes
   */
  getSize(): number {
    return this.stats.size;
  }

  /**
   * Set maximum cache size
   */
  setMaxSize(maxSize: number): void {
    this.stats.maxSize = maxSize;
    this.checkSizeLimit();
  }

  /**
   * Export cache data
   */
  export(): Record<string, any> {
    const exported: Record<string, any> = {};
    
    for (const [key, item] of this.cache.entries()) {
      exported[key] = {
        data: item.data,
        timestamp: item.timestamp,
        ttl: item.ttl,
        version: item.version,
        tags: item.tags
      };
    }
    
    return exported;
  }

  /**
   * Import cache data
   */
  import(data: Record<string, any>): number {
    let imported = 0;
    
    for (const [key, item] of Object.entries(data)) {
      if (item && typeof item === 'object' && 'data' in item) {
        this.cache.set(key, item as CacheItem<any>);
        imported++;
      }
    }
    
    this.updateSize();
    return imported;
  }

  /**
   * Destroy cache manager
   */
  destroy(): void {
    this.stopCleanupInterval();
    this.clear();
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Export classes for testing and advanced usage
export { CacheManager };
export class TaggedCacheManager<T> extends CacheManager {
  setWithTags(key: string, data: T, tags: string[], options: CacheOptions = {}): boolean {
    return this.set(key, data, { ...options, tags });
  }

  getByTag(tag: string): Array<{ key: string; data: T }> {
    const results: Array<{ key: string; data: T }> = [];
    for (const [key, item] of this.cache.entries()) {
      if (item.tags && item.tags.includes(tag)) {
        const data = this.get<T>(key);
        if (data !== null) {
          results.push({ key, data });
        }
      }
    }
    return results;
  }

  invalidateTag(tag: string): number {
    return this.invalidateByTags([tag]);
  }
}

export class CompressedCacheManager<T> extends CacheManager {
  set(key: string, data: T, options: CacheOptions = {}): boolean {
    return super.set(key, data, { ...options, compress: true });
  }

  get(key: string, options: { version?: string } = {}): T | null {
    return super.get<T>(key, { ...options, decompress: true });
  }
}

export class VersionedCacheManager<T> extends CacheManager {
  private currentVersion: string;

  constructor(version: string = '1.0', maxSize?: number) {
    super(maxSize);
    this.currentVersion = version;
  }

  set(key: string, data: T, options: CacheOptions = {}): boolean {
    return super.set(key, data, { ...options, version: this.currentVersion });
  }

  get(key: string): T | null {
    return super.get<T>(key, { version: this.currentVersion });
  }

  updateVersion(newVersion: string): void {
    this.currentVersion = newVersion;
    // Optionally clear cache when version changes
    this.clear();
  }
}

export const createCache = <T>(options: { maxSize?: number; version?: string } = {}): CacheManager => {
  return new CacheManager(options.maxSize);
};

// Utility functions for common patterns
export const withCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  // Try to get from cache first
  const cached = cacheManager.get<T>(key, { version: options.version });
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  cacheManager.set(key, data, options);
  
  return data;
};

// Cache decorator for methods
export const cache = (options: CacheOptions = {}) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}.${propertyKey}:${JSON.stringify(args)}`;
      
      return withCache(
        cacheKey,
        () => originalMethod.apply(this, args),
        options
      );
    };
    
    return descriptor;
  };
};

export default cacheManager;