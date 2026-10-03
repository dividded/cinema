import { Request, Response, NextFunction } from 'express';
import { Movie } from '../models/Movie';
import { BatchedFetcher } from '../services/BatchedFetcher';
import { CloudflareKvClient } from '../services/CloudflareKvClient';
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

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let memoryCache: { movies: Movie[]; expiresAt: number } | null = null;

export class MovieController {
  static async getCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      const cachedMovies = MovieController._getMoviesFromCache();

      if (cachedMovies) {
        logger.info('Cache hit! Returning cached movies.');
        res.json(cachedMovies);
        return;
      }

      logger.info('Cache miss. Fetching fresh movies...');
      const freshMovies = await MovieController._fetchAndParseMovies();

      res.json(freshMovies);

      MovieController._persistMovies(freshMovies).catch(err => {
        logger.error('Async persist error:', err);
      });

    } catch (error: any) {
      logger.errorWithStack('Error in getCinemathequeMovies:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  }

  static async forceRefreshCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Forcing refresh of cinematheque movies...');
      const freshMovies = await MovieController._fetchAndParseMovies();

      res.json(freshMovies);

      MovieController._persistMovies(freshMovies).catch(err => {
        logger.error('Async persist error during force refresh:', err);
      });

    } catch (error: any) {
      logger.errorWithStack('Error in forceRefreshCinemathequeMovies:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  }

  private static _getMoviesFromCache(): Movie[] | null {
    if (memoryCache && Date.now() < memoryCache.expiresAt) {
      return memoryCache.movies;
    }
    return null;
  }

  private static async _persistMovies(movies: Movie[]): Promise<void> {
    if (movies.length === 0) {
      logger.warn('Fetched no movies; keeping previously stored data.');
      return;
    }
    MovieController._storeMoviesInCache(movies);
    await CloudflareKvClient.putMovies(movies);
  }

  private static _storeMoviesInCache(movies: Movie[]): void {
    memoryCache = { movies, expiresAt: Date.now() + CACHE_TTL_MS };
    logger.info('Movies stored in memory cache.');
  }

  private static async _fetchAndParseMovies(): Promise<Movie[]> {
    logger.info(`Fetching movies for next ${NUMBER_OF_DAYS_TO_FETCH} days...`);

    const dates = Array.from({ length: NUMBER_OF_DAYS_TO_FETCH }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    return await fetcher.fetchMoviesForDates(dates);
  }
}
