import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express from 'express';
import cors from 'cors';
import { MovieController } from './controllers/MovieController';
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

// Hello World endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

// Start the server only if this script is run directly
function startServer() {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });
}

if (require.main === module) {
  startServer();
}

// Export the Express app for Vercel
export default app;
