class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemoryItems = 1000;
  }

  async initialize() {
    console.log('✅ In-memory cache initialized');
    return true;
  }

  async get(key) {
    try {
      return this.memoryCache.get(key) || null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      this.memoryCache.set(key, value);
      
      // Clean up old entries if too many
      if (this.memoryCache.size > this.maxMemoryItems) {
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }
      
      // Set TTL for memory cache
      setTimeout(() => {
        this.memoryCache.delete(key);
      }, ttlSeconds * 1000);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      this.memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern) {
    try {
      // For memory cache, iterate and delete matching keys
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }

  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.join(':')}`;
  }
}

module.exports = new CacheService();