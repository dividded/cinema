const CACHE_NAME = 'cinema-cache-v1';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface CacheEntry {
  data: any;
  timestamp: number;
}

export class CacheService {
  static async get(key: string): Promise<any | null> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(key);
      
      if (!response) return null;
      
      const data: CacheEntry = await response.json();
      const now = Date.now();
      
      // Check if cache is expired
      if (now - data.timestamp > CACHE_DURATION) {
        await cache.delete(key);
        return null;
      }
      
      return data.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key: string, data: any): Promise<void> {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cacheEntry: CacheEntry = {
        data,
        timestamp: Date.now()
      };
      
      const response = new Response(JSON.stringify(cacheEntry), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      await cache.put(key, response);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await caches.delete(CACHE_NAME);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
} 