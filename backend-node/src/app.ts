import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
console.log('Backend App Starting...'); // Add this line for testing

import express from 'express';
import cors from 'cors';
import { MovieController } from './controllers/MovieController';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Simple request logger middleware (before specific routes)
app.use((req, res, next) => {
  console.log(`[App] Received request: ${req.method} ${req.url}`);
  next(); // Pass control to the next middleware/route handler
});

// Routes
app.get('/api/movies/cinematheque', MovieController.getCinemathequeMovies);

// Hello World endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

// Export the Express app for Vercel
export default app; 