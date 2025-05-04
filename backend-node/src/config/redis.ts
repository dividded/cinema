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

export { redisClient, connectRedis }; 