const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.memoryCache = new Map(); // Fallback in-memory cache
    this.maxMemoryItems = 1000;
  }

  async initialize() {
    try {
      // Try Redis first
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL
        });
        
        await this.client.connect();
        this.connected = true;
        console.log('✅ Redis cache connected');
      } else {
        console.log('⚠️  Redis not configured, using in-memory cache');
      }
      
      return true;
    } catch (error) {
      console.log('⚠️  Redis unavailable, using in-memory cache:', error.message);
      return true; // Continue with memory cache
    }
  }

  async get(key) {
    try {
      if (this.connected) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.memoryCache.get(key) || null;
      }
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      if (this.connected) {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Memory cache with TTL simulation
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
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key) {
    try {
      if (this.connected) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern) {
    try {
      if (this.connected) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        // For memory cache, iterate and delete matching keys
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.memoryCache.delete(key);
          }
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