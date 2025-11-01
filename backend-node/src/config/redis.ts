import { createClient } from 'redis';

// Use environment variables for Redis connection details
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL environment variable is not set. Redis features will be unavailable.');
}

const redisClient = redisUrl ? createClient({ url: redisUrl }) : null;

if (redisClient) {
  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
}

// Function to initiate connection
async function connectRedis() {
  if (!redisClient) {
      console.log('Redis client not configured. Skipping connection.');
      return;
  }
  try {
    await redisClient.connect();
    console.log('Redis client connected successfully.');
  } catch (err) {
    console.error('Failed to connect to Redis on startup:', err);
    // Don't exit, just log the error. The app can proceed without Redis.
  }
}

/**
 * Ensures Redis is connected before use.
 * This is crucial for serverless environments where connections aren't persisted.
 * In serverless, each invocation may be a new instance, so we need to connect on-demand.
 */
async function ensureRedisConnected(): Promise<boolean> {
  if (!redisClient) {
    return false;
  }
  
  // If already connected, return true
  if (redisClient.isReady) {
    return true;
  }
  
  // Try to connect if not ready
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('Redis client connected on-demand.');
    }
    return redisClient.isReady;
  } catch (err) {
    console.error('Failed to connect to Redis on-demand:', err);
    return false;
  }
}

export { redisClient, connectRedis, ensureRedisConnected }; 