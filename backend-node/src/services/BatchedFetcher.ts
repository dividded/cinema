import pLimit from 'p-limit';
import { JSDOM } from 'jsdom';
import { MovieParser } from './MovieParser';
import { Movie } from '../models/Movie';
import { createLogger } from '../utils/Logger';

const logger = createLogger('BatchedFetcher');

/**
 * Configuration for batched fetching
 */
export interface BatchedFetcherConfig {
  batchSize: number;          // Number of parallel requests per batch
  minBatchDelayMs: number;    // Minimum delay between batches
  maxBatchDelayMs: number;    // Maximum delay between batches
  fetchTimeoutMs: number;     // Timeout per request
}

/**
 * Default configuration for movie fetching
 */
export const DEFAULT_FETCHER_CONFIG: BatchedFetcherConfig = {
  batchSize: 5,
  minBatchDelayMs: 500,
  maxBatchDelayMs: 2000,
  fetchTimeoutMs: 30000
};

/**
 * Service for fetching and parsing movies with batched, throttled requests.
 * Prevents overwhelming the server while maintaining good performance.
 */
export class BatchedFetcher {
  private config: BatchedFetcherConfig;

  constructor(config: Partial<BatchedFetcherConfig> = {}) {
    this.config = { ...DEFAULT_FETCHER_CONFIG, ...config };
  }

  /**
   * Fetches and parses movies for multiple dates using batched requests.
   * @param dates Array of date strings in ISO format (YYYY-MM-DD)
   * @returns Array of unique movies with merged screenings
   */
  async fetchMoviesForDates(dates: string[]): Promise<Movie[]> {
    logger.info(`Starting batched fetch for ${dates.length} dates...`);
    logger.info(`Config: ${this.config.batchSize} parallel requests per batch, ` +
                `${this.config.minBatchDelayMs}-${this.config.maxBatchDelayMs}ms delay between batches`);
    
    // Split dates into batches
    const batches = this._splitIntoBatches(dates);
    logger.info(`Split into ${batches.length} batches`);

    // Launch all batches with staggered delays
    const allFetchPromises = batches.map((batch, batchIndex) => 
      this._processBatch(batch, batchIndex, batches.length, dates.length)
    );

    // Wait for all batches to complete
    logger.debug('Waiting for all batches to complete...');
    const allResults = await Promise.all(allFetchPromises);
    const allMovies = allResults.flat();

    // Merge duplicate movies and their screenings
    const mergedMovies = this._mergeMovies(allMovies);
    
    logger.info(`Total unique movies found: ${mergedMovies.length}`);
    return mergedMovies;
  }

  /**
   * Splits an array of dates into batches based on config.batchSize
   */
  private _splitIntoBatches(dates: string[]): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < dates.length; i += this.config.batchSize) {
      batches.push(dates.slice(i, i + this.config.batchSize));
    }
    return batches;
  }

  /**
   * Processes a single batch of dates with a random delay before starting
   */
  private async _processBatch(
    batch: string[], 
    batchIndex: number, 
    totalBatches: number,
    totalDates: number
  ): Promise<Movie[]> {
    // Calculate random delay (no delay for first batch)
    const delay = batchIndex === 0 
      ? 0 
      : Math.random() * (this.config.maxBatchDelayMs - this.config.minBatchDelayMs) + this.config.minBatchDelayMs;

    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    logger.debug(`Launching batch ${batchIndex + 1}/${totalBatches} with ${batch.length} requests (delay: ${delay.toFixed(0)}ms)`);
    
    // Launch all requests in this batch in parallel using p-limit
    const limit = pLimit(this.config.batchSize);
    const batchResults = await Promise.all(
      batch.map((date, index) => 
        limit(() => this._fetchSingleDate(date, batchIndex * this.config.batchSize + index + 1, totalDates))
      )
    );
    
    return batchResults.flat();
  }

  /**
   * Fetches and parses movies for a single date
   */
  private async _fetchSingleDate(date: string, index: number, total: number): Promise<Movie[]> {
    try {
      logger.debug(`[${index}/${total}] Fetching date: ${date}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.fetchTimeoutMs);

      const response = await fetch(`https://www.cinema.co.il/shown/?date=${date}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const movies = MovieParser.parseFromDateHtml(dom.window.document);
      
      logger.debug(`[${index}/${total}] ✓ Success: ${movies.length} movies for ${date}`);
      return movies;
      
    } catch (fetchError: any) {
      if (fetchError.name === 'AbortError') {
        logger.error(`[${index}/${total}] ✗ Timeout for ${date} (exceeded ${this.config.fetchTimeoutMs}ms)`);
      } else {
        logger.error(`[${index}/${total}] ✗ Error for ${date}:`, fetchError.message);
      }
      return []; // Return empty array on error
    }
  }

  /**
   * Merges movies with the same title, combining their screenings
   */
  private _mergeMovies(movies: Movie[]): Movie[] {
    const movieMap = new Map<string, Movie>();

    movies.forEach(movie => {
      const existing = movieMap.get(movie.title);
      
      if (existing) {
        // Merge screenings, avoiding duplicates
        movie.screenings.forEach(screening => {
          const isDuplicate = existing.screenings.some(
            s => s.dateTime === screening.dateTime && s.venue === screening.venue
          );
          if (!isDuplicate) {
            existing.screenings.push(screening);
          }
        });
      } else {
        movieMap.set(movie.title, movie);
      }
    });

    return Array.from(movieMap.values());
  }
}

