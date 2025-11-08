import { createClient } from 'redis';
import { createLogger } from '../utils/Logger';

const logger = createLogger('redis');

// Use environment variables for Redis connection details
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  logger.warn('REDIS_URL environment variable is not set. Redis features will be unavailable.');
}

const redisClient = redisUrl ? createClient({ url: redisUrl }) : null;

if (redisClient) {
  redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
}

// Function to initiate connection
async function connectRedis() {
  if (!redisClient) {
      logger.info('Redis client not configured. Skipping connection.');
      return;
  }
  try {
    await redisClient.connect();
    logger.info('Redis client connected successfully.');
  } catch (err) {
    logger.errorWithStack('Failed to connect to Redis on startup:', err instanceof Error ? err : new Error(String(err)));
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
      logger.info('Redis client connected on-demand.');
    }
    return redisClient.isReady;
  } catch (err) {
    logger.errorWithStack('Failed to connect to Redis on-demand:', err instanceof Error ? err : new Error(String(err)));
    return false;
  }
}

export { redisClient, connectRedis, ensureRedisConnected }; 