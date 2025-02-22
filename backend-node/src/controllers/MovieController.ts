import { Request, Response } from 'express';
import { JSDOM } from 'jsdom';
import { MovieParser } from '../services/MovieParser';
import { Movie } from '../models/Movie';

export class MovieController {
  static async getCinemathequeMovies(req: Request, res: Response) {
    try {
      console.log('Starting to fetch movies for next 30 days...');
      const allMovies = new Set<Movie>();
      
      // Get next 30 days
      const dates = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      });

      // Fetch movies for each date in parallel
      const moviePromises = dates.map(async (date) => {
        try {
          console.log(`Fetching movies for date: ${date}`);
          const response = await fetch(`https://www.cinema.co.il/shown/?date=${date}`);
          const html = await response.text();
          
          const dom = new JSDOM(html);
          const document = dom.window.document;
          
          return MovieParser.parseFromDateHtml(document);
        } catch (error) {
          console.error(`Error fetching movies for date ${date}:`, error);
          return [];
        }
      });

      const moviesArrays = await Promise.all(moviePromises);
      
      // Combine all movies, removing duplicates based on title
      moviesArrays.flat().forEach(movie => {
        const existingMovie = Array.from(allMovies).find(m => m.title === movie.title);
        if (existingMovie) {
          // Merge screenings
          movie.screenings.forEach(screening => {
            if (!existingMovie.screenings.some(s => 
              s.dateTime === screening.dateTime && s.venue === screening.venue
            )) {
              existingMovie.screenings.push(screening);
            }
          });
        } else {
          allMovies.add(movie);
        }
      });

      console.log(`Total unique movies found: ${allMovies.size}`);
      res.json(Array.from(allMovies));
    } catch (error) {
      console.error('Error fetching or parsing movies:', error);
      res.status(500).json({ error: 'Failed to fetch movies' });
    }
  }
} 