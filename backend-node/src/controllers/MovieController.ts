import { Request, Response, NextFunction } from 'express';
import { Movie } from '../models/Movie';
import { redisClient, ensureRedisConnected } from '../config/redis';
import { BatchedFetcher } from '../services/BatchedFetcher';
import { createLogger } from '../utils/Logger';

const logger = createLogger('MovieController');

// Configuration - all values can be overridden via environment variables
const NUMBER_OF_DAYS_TO_FETCH = parseInt(process.env.MOVIE_FETCH_DAYS || '30', 10);
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);
const MIN_BATCH_DELAY_MS = parseInt(process.env.BATCH_MIN_DELAY_MS || '500', 10);
const MAX_BATCH_DELAY_MS = parseInt(process.env.BATCH_MAX_DELAY_MS || '2000', 10);
const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS || '30000', 10);

const fetcher = new BatchedFetcher({
  batchSize: BATCH_SIZE,
  minBatchDelayMs: MIN_BATCH_DELAY_MS,
  maxBatchDelayMs: MAX_BATCH_DELAY_MS,
  fetchTimeoutMs: FETCH_TIMEOUT_MS
});

logger.info('Movie Fetcher Configuration:', {
  daysToFetch: NUMBER_OF_DAYS_TO_FETCH,
  batchSize: BATCH_SIZE,
  minBatchDelayMs: MIN_BATCH_DELAY_MS,
  maxBatchDelayMs: MAX_BATCH_DELAY_MS,
  fetchTimeoutMs: FETCH_TIMEOUT_MS
});

const CACHE_KEY = 'cinemathequeMovies';
const ONE_HOUR_IN_SECONDS = 60 * 60;
const CACHE_EXPIRATION_SECONDS = ONE_HOUR_IN_SECONDS * 24;

export class MovieController {
  static async getCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Try fetching from cache
      const cachedMovies = await MovieController._getMoviesFromCache();

      if (cachedMovies) {
        logger.info('Cache hit! Returning cached movies.');
        res.json(cachedMovies);
        return;
      }

      // 2. Fetch fresh data if cache missed
      logger.info('Cache miss. Fetching fresh movies...');
      const freshMovies = await MovieController._fetchAndParseMovies();

      // Send the response
      res.json(freshMovies);

      // 3. Store fresh data in cache asynchronously
      MovieController._storeMoviesInCache(freshMovies).catch(err => {
        logger.error('Async Redis SET error:', err);
      });

    } catch (error: any) {
      logger.errorWithStack('Error in getCinemathequeMovies:', error instanceof Error ? error : new Error(String(error)));
      next(error); // Use next for error handling
    }
  }

  /**
   * Forces a refresh of the movie data, bypassing the cache check,
   * stores the new data in cache, and returns it with no client caching.
   */
  static async forceRefreshCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Forcing refresh of cinematheque movies...');
      const freshMovies = await MovieController._fetchAndParseMovies();

      // Send the response
      res.json(freshMovies);

      // Store fresh data in cache asynchronously
      MovieController._storeMoviesInCache(freshMovies).catch(err => {
        logger.error('Async Redis SET error during force refresh:', err);
      });

    } catch (error: any) {
      logger.errorWithStack('Error in forceRefreshCinemathequeMovies:', error instanceof Error ? error : new Error(String(error)));
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
        logger.warn('Redis client not available or not ready, skipping cache check.');
        return null;
      }
      const cachedData = await redisClient!.get(CACHE_KEY);
      if (cachedData) {
        return JSON.parse(cachedData) as Movie[];
      }
      return null;
    } catch (cacheError) {
      logger.error('Redis GET error:', cacheError);
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
        logger.warn('Redis client not available or not ready, skipping cache set.');
        return;
      }
      await redisClient!.set(CACHE_KEY, JSON.stringify(movies), {
        EX: CACHE_EXPIRATION_SECONDS
      });
      logger.info('Movies stored in cache.');
    } catch (cacheError) {
      logger.error('Redis SET error:', cacheError);
      // Don't throw, just log the error
    }
  }

  /**
   * Fetches movie data for the configured number of days,
   * parses HTML, and merges results using the BatchedFetcher service.
   */
  private static async _fetchAndParseMovies(): Promise<Movie[]> {
    logger.info(`Fetching movies for next ${NUMBER_OF_DAYS_TO_FETCH} days...`);
    
    // Generate all dates to fetch
    const dates = Array.from({ length: NUMBER_OF_DAYS_TO_FETCH }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    // Use the batched fetcher service to fetch and merge movies
    return await fetcher.fetchMoviesForDates(dates);
  }

  /**
   * Deletes the movie cache from Redis.
   */
  static async deleteCache(req: Request, res: Response, next: NextFunction) {
    try {
      // Ensure Redis is connected (important for serverless environments)
      const isConnected = await ensureRedisConnected();
      if (!isConnected) {
        logger.warn('Redis client not available or not ready, cannot delete cache.');
        // Use standard error handling pattern with next()
        const err = new Error('Cache service unavailable');
        (err as any).status = 503; // Add status code to error object
        return next(err); // Forward the error
      }

      const result = await redisClient!.del(CACHE_KEY);

      if (result > 0) {
        logger.info(`Cache key '${CACHE_KEY}' deleted successfully.`);
        res.status(200).json({ message: `Cache key '${CACHE_KEY}' deleted successfully.` });
      } else {
        logger.info(`Cache key '${CACHE_KEY}' not found or already deleted.`);
        res.status(404).json({ message: `Cache key '${CACHE_KEY}' not found.` });
      }
    } catch (error: any) {
      logger.errorWithStack('Error deleting cache:', error instanceof Error ? error : new Error(String(error)));
      // Forward error to Express error handler
      next(error); // Use next for error handling
    }
  }
} 