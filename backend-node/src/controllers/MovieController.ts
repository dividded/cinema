import { Request, Response } from 'express';
import { JSDOM } from 'jsdom';
import { MovieParser } from '../services/MovieParser';
import { Movie } from '../models/Movie';
import redisClient from '../config/redis'; // Import the Redis client

const NUMBER_OF_DAYS_TO_FETCH = 60;
const CACHE_KEY = 'cinemathequeMovies';

const ONE_HOUR_IN_SECONDS = 60 * 60;
const CACHE_EXPIRATION_SECONDS = ONE_HOUR_IN_SECONDS * 24;

export class MovieController {
  static async getCinemathequeMovies(req: Request, res: Response) {
    try {
      // 1. Try fetching from cache
      const cachedMovies = await MovieController._getMoviesFromCache();

      if (cachedMovies) {
        console.log('Cache hit! Returning cached movies.');
        res.set({
          'Cache-Control': `public, max-age=${CACHE_EXPIRATION_SECONDS}`,
          'ETag': new Date().toISOString().split('T')[0], // Consider a more robust ETag based on content hash if possible
          'Vary': 'Accept-Encoding'
        });
        res.json(cachedMovies);
        return;
      }

      // 2. Fetch fresh data if cache missed
      console.log('Cache miss. Fetching fresh movies...');
      const freshMovies = await MovieController._fetchAndParseMovies();

      // Set cache headers for the fresh response
      res.set({
         // Shorter max-age for fresh data might be desired, or keep it the same
        'Cache-Control': `public, max-age=${CACHE_EXPIRATION_SECONDS / 2}`,
        'ETag': new Date().toISOString().split('T')[0],
        'Vary': 'Accept-Encoding'
      });

      // Send the response first
      res.json(freshMovies);

      // 3. Store fresh data in cache asynchronously (fire and forget)
      // We don't await this, so it doesn't delay the user response
      MovieController._storeMoviesInCache(freshMovies).catch(err => {
        // Log errors from async cache storing, but don't crash
        console.error('Async Redis SET error:', err);
      });

    } catch (error: any) {
      console.error('Error in getCinemathequeMovies:', error);
      if (!res.headersSent) {
         res.status(500).json({ error: 'Failed to fetch movies' });
      }
    }
  }

  /**
   * Retrieves and parses movies from the Redis cache.
   * Returns the parsed movie array or null if not found or error.
   */
  private static async _getMoviesFromCache(): Promise<Movie[] | null> {
    try {
      if (!redisClient.isReady) {
        console.warn('Redis client not ready, skipping cache check.');
        return null;
      }
      const cachedData = await redisClient.get(CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData) as Movie[];
      }
      return null;
    } catch (cacheError) {
      console.error('Redis GET error:', cacheError);
      return null; // Don't fail request on cache error
    }
  }

  /**
   * Stores the provided movie data in the Redis cache.
   */
  private static async _storeMoviesInCache(movies: Movie[]): Promise<void> {
    try {
      if (!redisClient.isReady) {
        console.warn('Redis client not ready, skipping cache set.');
        return;
      }
      await redisClient.set(CACHE_KEY, JSON.stringify(movies), {
        EX: CACHE_EXPIRATION_SECONDS
      });
      console.log('Movies stored in cache.');
    } catch (cacheError) {
      console.error('Redis SET error:', cacheError);
      // Don't throw, just log the error
    }
  }

  /**
   * Fetches movie data for the configured number of days,
   * parses HTML, and merges results.
   */
  private static async _fetchAndParseMovies(): Promise<Movie[]> {
    console.log(`Starting to fetch movies for next ${NUMBER_OF_DAYS_TO_FETCH} days...`);
    const allMovies = new Set<Movie>();

    const dates = Array.from({ length: NUMBER_OF_DAYS_TO_FETCH }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    const moviePromises = dates.map(async (date) => {
      try {
        // Consider adding a short delay or using a library like p-limit
        // if fetching too rapidly causes issues with the target server.
        // console.log(`Fetching movies for date: ${date}`);
        const response = await fetch(`https://www.cinema.co.il/shown/?date=${date}`);
        if (!response.ok) {
          throw new Error(`Fetch failed with status ${response.status} for date ${date}`);
        }
        const html = await response.text();
        const dom = new JSDOM(html);
        return MovieParser.parseFromDateHtml(dom.window.document);
      } catch (fetchError: any) {
        console.error(`Error fetching movies for date ${date}:`, fetchError);
        return []; // Return empty array for this date on error
      }
    });

    const moviesArrays = await Promise.all(moviePromises);

    // Combine results and handle duplicates/merging
    moviesArrays.flat().forEach(movie => {
      const existingMovie = Array.from(allMovies).find(m => m.title === movie.title);
      if (existingMovie) {
        movie.screenings.forEach(screening => {
          if (!existingMovie.screenings.some(s => s.dateTime === screening.dateTime && s.venue === screening.venue)) {
            existingMovie.screenings.push(screening);
          }
        });
      } else {
        allMovies.add(movie);
      }
    });

    const moviesResult = Array.from(allMovies);
    console.log(`Total unique movies found: ${moviesResult.length}`);
    return moviesResult;
  }
} 