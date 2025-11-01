import { Request, Response, NextFunction } from 'express';
import { JSDOM } from 'jsdom';
import { MovieParser } from '../services/MovieParser';
import { Movie } from '../models/Movie';
import { redisClient, ensureRedisConnected } from '../config/redis'; // Import the Redis client and connection helper

const NUMBER_OF_DAYS_TO_FETCH = 30;
const CACHE_KEY = 'cinemathequeMovies';

const ONE_HOUR_IN_SECONDS = 60 * 60;
const CACHE_EXPIRATION_SECONDS = ONE_HOUR_IN_SECONDS * 24; // Redis TTL

export class MovieController {
  static async getCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Try fetching from cache
      const cachedMovies = await MovieController._getMoviesFromCache();

      if (cachedMovies) {
        console.log('Cache hit! Returning cached movies.');
        res.json(cachedMovies);
        return;
      }

      // 2. Fetch fresh data if cache missed
      console.log('Cache miss. Fetching fresh movies...');
      const freshMovies = await MovieController._fetchAndParseMovies();

      // Send the response
      res.json(freshMovies);

      // 3. Store fresh data in cache asynchronously
      MovieController._storeMoviesInCache(freshMovies).catch(err => {
        console.error('Async Redis SET error:', err);
      });

    } catch (error: any) {
      console.error('Error in getCinemathequeMovies:', error);
      next(error); // Use next for error handling
    }
  }

  /**
   * Forces a refresh of the movie data, bypassing the cache check,
   * stores the new data in cache, and returns it with no client caching.
   */
  static async forceRefreshCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('Forcing refresh of cinematheque movies...');
      const freshMovies = await MovieController._fetchAndParseMovies();

      // Send the response
      res.json(freshMovies);

      // Store fresh data in cache asynchronously
      MovieController._storeMoviesInCache(freshMovies).catch(err => {
        console.error('Async Redis SET error during force refresh:', err);
      });

    } catch (error: any) {
      console.error('Error in forceRefreshCinemathequeMovies:', error);
      next(error);
    }
  }

  /**
   * Retrieves and parses movies from the Redis cache.
   * Returns the parsed movie array or null if not found or error.
   */
  private static async _getMoviesFromCache(): Promise<Movie[] | null> {
    try {
      // Ensure Redis is connected (important for serverless environments)
      const isConnected = await ensureRedisConnected();
      if (!isConnected) {
        console.warn('Redis client not available or not ready, skipping cache check.');
        return null;
      }
      const cachedData = await redisClient!.get(CACHE_KEY);
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
      // Ensure Redis is connected (important for serverless environments)
      const isConnected = await ensureRedisConnected();
      if (!isConnected) {
        console.warn('Redis client not available or not ready, skipping cache set.');
        return;
      }
      await redisClient!.set(CACHE_KEY, JSON.stringify(movies), {
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

  /**
   * Deletes the movie cache from Redis.
   */
  static async deleteCache(req: Request, res: Response, next: NextFunction) {
    try {
      // Ensure Redis is connected (important for serverless environments)
      const isConnected = await ensureRedisConnected();
      if (!isConnected) {
        console.warn('Redis client not available or not ready, cannot delete cache.');
        // Use standard error handling pattern with next()
        const err = new Error('Cache service unavailable');
        (err as any).status = 503; // Add status code to error object
        return next(err); // Forward the error
      }

      const result = await redisClient!.del(CACHE_KEY);

      if (result > 0) {
        console.log(`Cache key '${CACHE_KEY}' deleted successfully.`);
        res.status(200).json({ message: `Cache key '${CACHE_KEY}' deleted successfully.` });
      } else {
        console.log(`Cache key '${CACHE_KEY}' not found or already deleted.`);
        res.status(404).json({ message: `Cache key '${CACHE_KEY}' not found.` });
      }
    } catch (error: any) {
      console.error('Error deleting cache:', error);
      // Forward error to Express error handler
      next(error); // Use next for error handling
    }
  }
} 