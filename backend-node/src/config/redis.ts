import { createClient } from 'redis';

// Use environment variables for Redis connection details
const redisUrl = process.env.REDIS_URL;

const redisClient = createClient({
  url: redisUrl // Use the URL from the environment variable
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect the client
redisClient.connect().catch(console.error);

export default redisClient; 