import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express from 'express';
import cors from 'cors';
import { MovieController } from './controllers/MovieController';
import { connectRedis } from './config/redis'; // Import the connect function
import { createLogger } from './utils/Logger';

const logger = createLogger('app');

logger.info('Backend App Starting...');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Simple request logger middleware (before specific routes)
app.use((req, res, next) => {
  logger.debug(`Received request: ${req.method} ${req.url}`);
  next(); // Pass control to the next middleware/route handler
});

// Routes
app.get('/api/movies/cinematheque', MovieController.getCinemathequeMovies);
app.get('/api/movies/cinematheque/refresh', MovieController.forceRefreshCinemathequeMovies);
app.get('/api/movies/delete-cache', MovieController.deleteCache);

// Hello World endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Start the server only if this script is run directly
async function startServer() {
  // Attempt to connect to Redis before starting the server
  await connectRedis();

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch(error => {
    logger.errorWithStack("Failed to start server:", error instanceof Error ? error : new Error(String(error)));
    process.exit(1); // Optionally exit if server setup fails critically
  });
}

// Export the Express app for Vercel
export default app; 