import { Request, Response, NextFunction } from 'express';
import { Movie } from '../models/Movie';
import { BatchedFetcher } from '../services/BatchedFetcher';
import { createLogger } from '../utils/Logger';
import { getUpcomingDates } from '../utils/dates';

const logger = createLogger('MovieController');

// Configuration - all values can be overridden via environment variables
const NUMBER_OF_DAYS_TO_FETCH = parseInt(process.env.MOVIE_FETCH_DAYS || '45', 10);
const MAX_DAYS_TO_FETCH = 60;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '3', 10);
const MIN_BATCH_DELAY_MS = parseInt(process.env.BATCH_MIN_DELAY_MS || '500', 10);
const MAX_BATCH_DELAY_MS = parseInt(process.env.BATCH_MAX_DELAY_MS || '1500', 10);
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

/**
 * The backend is a stateless scraper: the Cloudflare Worker calls `/days`, merges the
 * per-day results with what it already has and is the only writer to KV. The movie-list
 * endpoints remain for local development.
 */
export class MovieController {
  static async getCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      if (memoryCache && Date.now() < memoryCache.expiresAt) {
        logger.info('Cache hit! Returning cached movies.');
        res.json(memoryCache.movies);
        return;
      }

      logger.info('Cache miss. Fetching fresh movies...');
      res.json(await MovieController._fetchAndCacheMovies());
    } catch (error: any) {
      logger.errorWithStack('Error in getCinemathequeMovies:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  }

  static async forceRefreshCinemathequeMovies(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Forcing refresh of cinematheque movies...');
      res.json(await MovieController._fetchAndCacheMovies());
    } catch (error: any) {
      logger.errorWithStack('Error in forceRefreshCinemathequeMovies:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  }

  /** Scrapes each upcoming day and reports per-day success, so failed days can keep old data. */
  static async getCinemathequeDays(req: Request, res: Response, next: NextFunction) {
    try {
      const requestedDays = parseInt(String(req.query.days ?? ''), 10) || NUMBER_OF_DAYS_TO_FETCH;
      const numberOfDays = Math.min(Math.max(requestedDays, 1), MAX_DAYS_TO_FETCH);

      logger.info(`Fetching per-day schedule for next ${numberOfDays} days...`);
      const days = await fetcher.fetchDays(getUpcomingDates(numberOfDays));

      res.set('Cache-Control', 'no-store');
      res.json({ fetchedAt: new Date().toISOString(), days });
    } catch (error: any) {
      logger.errorWithStack('Error in getCinemathequeDays:', error instanceof Error ? error : new Error(String(error)));
      next(error);
    }
  }

  private static async _fetchAndCacheMovies(): Promise<Movie[]> {
    logger.info(`Fetching movies for next ${NUMBER_OF_DAYS_TO_FETCH} days...`);
    const movies = await fetcher.fetchMoviesForDates(getUpcomingDates(NUMBER_OF_DAYS_TO_FETCH));

    if (movies.length > 0) {
      memoryCache = { movies, expiresAt: Date.now() + CACHE_TTL_MS };
    } else {
      logger.warn('Fetched no movies; not caching the result.');
    }
    return movies;
  }
}
