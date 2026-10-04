import { JSDOM } from 'jsdom';
import { MovieParser } from './MovieParser';
import { Movie } from '../models/Movie';
import { createLogger } from '../utils/Logger';

const logger = createLogger('BatchedFetcher');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Result of fetching a single day's schedule. A failed day carries no movies,
 * so callers can keep previously known data for it instead of overwriting it.
 */
export interface DayResult {
  date: string;
  ok: boolean;
  movies: Movie[];
  error?: string;
}

/**
 * Configuration for batched fetching
 */
export interface BatchedFetcherConfig {
  batchSize: number;          // Number of parallel requests per batch
  minBatchDelayMs: number;    // Minimum delay between batches
  maxBatchDelayMs: number;    // Maximum delay between batches
  fetchTimeoutMs: number;     // Timeout per request
  retryRounds: number;        // Extra passes over dates that failed
  retryDelayMs: number;       // Pause before each retry pass
}

/**
 * Default configuration for movie fetching
 */
export const DEFAULT_FETCHER_CONFIG: BatchedFetcherConfig = {
  // The site serves a rate-limit page ("One moment, please...") beyond ~4 concurrent requests.
  batchSize: 3,
  minBatchDelayMs: 500,
  maxBatchDelayMs: 1500,
  fetchTimeoutMs: 30000,
  retryRounds: 2,
  // The rate-limit page asks browsers to retry after 5 seconds.
  retryDelayMs: 6000
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
    const days = await this.fetchDays(dates);
    const mergedMovies = this._mergeMovies(days.flatMap(day => day.movies));

    logger.info(`Total unique movies found: ${mergedMovies.length}`);
    return mergedMovies;
  }

  /**
   * Fetches each date's schedule using batched requests and reports per-day success.
   * @param dates Array of date strings in ISO format (YYYY-MM-DD)
   */
  async fetchDays(dates: string[]): Promise<DayResult[]> {
    logger.info(`Starting batched fetch for ${dates.length} dates...`);
    logger.info(`Config: ${this.config.batchSize} parallel requests per batch, ` +
                `${this.config.minBatchDelayMs}-${this.config.maxBatchDelayMs}ms delay between batches`);

    const results = new Map<string, DayResult>();
    for (const day of await this._fetchInBatches(dates)) results.set(day.date, day);

    for (let round = 1; round <= this.config.retryRounds; round++) {
      const failed = dates.filter(date => results.get(date)?.ok !== true);
      if (failed.length === 0) break;

      logger.info(`Retry ${round}/${this.config.retryRounds} for ${failed.length} failed dates...`);
      await sleep(this.config.retryDelayMs);
      for (const day of await this._fetchInBatches(failed)) results.set(day.date, day);
    }

    const days = dates.map(
      (date): DayResult => results.get(date) ?? { date, ok: false, movies: [], error: 'Not fetched' },
    );
    const failed = days.filter(day => !day.ok).map(day => day.date);
    logger.info(`Fetched ${days.length - failed.length}/${days.length} dates` +
                (failed.length > 0 ? `; failed: ${failed.join(', ')}` : ''));
    return days;
  }

  /**
   * Fetches dates one batch at a time, pausing between batches, so the site never
   * sees more than `batchSize` concurrent requests.
   */
  private async _fetchInBatches(dates: string[]): Promise<DayResult[]> {
    const results: DayResult[] = [];
    for (let i = 0; i < dates.length; i += this.config.batchSize) {
      if (i > 0) await sleep(this._randomBatchDelay());

      const batch = dates.slice(i, i + this.config.batchSize);
      logger.debug(`Launching batch with ${batch.length} requests (${i + batch.length}/${dates.length})`);
      results.push(...await Promise.all(
        batch.map((date, index) => this._fetchSingleDate(date, i + index + 1, dates.length))
      ));
    }
    return results;
  }

  private _randomBatchDelay(): number {
    const { minBatchDelayMs, maxBatchDelayMs } = this.config;
    return minBatchDelayMs + Math.random() * (maxBatchDelayMs - minBatchDelayMs);
  }

  /**
   * Fetches and parses movies for a single date. Never throws; failures are reported in the result.
   */
  private async _fetchSingleDate(date: string, index: number, total: number): Promise<DayResult> {
    try {
      logger.debug(`[${index}/${total}] Fetching date: ${date}`);
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => { controller.abort(); }, this.config.fetchTimeoutMs);

      const response = await fetch(`https://www.cinema.co.il/shown/?date=${date}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      const movies = MovieParser.parseFromDateHtml(document);

      // An empty day is only trusted if the page still looks like a schedule page;
      // otherwise a layout change or error page would wipe that day's data.
      if (movies.length === 0 && !document.querySelector('span.main-date')) {
        throw new Error('Unrecognised schedule page (no movies and no date header)');
      }

      logger.debug(`[${index}/${total}] ✓ Success: ${movies.length} movies for ${date}`);
      return { date, ok: true, movies };

    } catch (fetchError: unknown) {
      const timedOut = fetchError instanceof Error && fetchError.name === 'AbortError';
      const message = fetchError instanceof Error ? fetchError.message : String(fetchError);
      if (timedOut) {
        logger.error(`[${index}/${total}] ✗ Timeout for ${date} (exceeded ${this.config.fetchTimeoutMs}ms)`);
      } else {
        logger.error(`[${index}/${total}] ✗ Error for ${date}:`, message);
      }
      return { date, ok: false, movies: [], error: timedOut ? 'Timeout' : message };
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

