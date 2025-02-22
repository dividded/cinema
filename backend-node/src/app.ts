export const maxDuration = 60; // This function can run for a maximum of 60 seconds

import express from 'express';
import cors from 'cors';
import { MovieController } from './controllers/MovieController';

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

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