"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieController = void 0;
const jsdom_1 = require("jsdom");
const MovieParser_1 = require("../services/MovieParser");
const redis_1 = require("../config/redis"); // Import the Redis client and connection helper
const NUMBER_OF_DAYS_TO_FETCH = 60;
const CACHE_KEY = 'cinemathequeMovies';
const ONE_HOUR_IN_SECONDS = 60 * 60;
const CLIENT_CACHE_MAX_AGE_SECONDS = 60 * 10; // 10 minutes
const CACHE_EXPIRATION_SECONDS = ONE_HOUR_IN_SECONDS * 24; // Redis TTL
class MovieController {
    static getCinemathequeMovies(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 1. Try fetching from cache
                const cachedMovies = yield MovieController._getMoviesFromCache();
                if (cachedMovies) {
                    console.log('Cache hit! Returning cached movies.');
                    res.set({
                        'Cache-Control': `public, max-age=${CACHE_EXPIRATION_SECONDS}`, // Long cache for server-cached data
                        'ETag': new Date().toISOString().split('T')[0], // Consider a more robust ETag
                        'Vary': 'Accept-Encoding'
                    });
                    res.json(cachedMovies);
                    return;
                }
                // 2. Fetch fresh data if cache missed
                console.log('Cache miss. Fetching fresh movies...');
                const freshMovies = yield MovieController._fetchAndParseMovies();
                // Set cache headers for the fresh response - short client cache
                res.set({
                    'Cache-Control': `public, max-age=${CLIENT_CACHE_MAX_AGE_SECONDS}`,
                    'ETag': new Date().toISOString().split('T')[0],
                    'Vary': 'Accept-Encoding'
                });
                // Send the response first
                res.json(freshMovies);
                // 3. Store fresh data in cache asynchronously
                MovieController._storeMoviesInCache(freshMovies).catch(err => {
                    console.error('Async Redis SET error:', err);
                });
            }
            catch (error) {
                console.error('Error in getCinemathequeMovies:', error);
                next(error); // Use next for error handling
            }
        });
    }
    /**
     * Forces a refresh of the movie data, bypassing the cache check,
     * stores the new data in cache, and returns it with no client caching.
     */
    static forceRefreshCinemathequeMovies(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Forcing refresh of cinematheque movies...');
                const freshMovies = yield MovieController._fetchAndParseMovies();
                // Set headers for no client caching
                res.set({
                    'Cache-Control': 'public, max-age=0, no-cache, must-revalidate',
                    'Expires': '0',
                    'Pragma': 'no-cache',
                    'ETag': new Date().toISOString(), // Use a unique ETag like timestamp
                    'Vary': 'Accept-Encoding'
                });
                // Send the response first
                res.json(freshMovies);
                // Store fresh data in cache asynchronously
                MovieController._storeMoviesInCache(freshMovies).catch(err => {
                    console.error('Async Redis SET error during force refresh:', err);
                });
            }
            catch (error) {
                console.error('Error in forceRefreshCinemathequeMovies:', error);
                next(error);
            }
        });
    }
    /**
     * Retrieves and parses movies from the Redis cache.
     * Returns the parsed movie array or null if not found or error.
     */
    static _getMoviesFromCache() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure Redis is connected (important for serverless environments)
                const isConnected = yield (0, redis_1.ensureRedisConnected)();
                if (!isConnected) {
                    console.warn('Redis client not available or not ready, skipping cache check.');
                    return null;
                }
                const cachedData = yield redis_1.redisClient.get(CACHE_KEY);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
                return null;
            }
            catch (cacheError) {
                console.error('Redis GET error:', cacheError);
                return null; // Don't fail request on cache error
            }
        });
    }
    /**
     * Stores the provided movie data in the Redis cache.
     */
    static _storeMoviesInCache(movies) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure Redis is connected (important for serverless environments)
                const isConnected = yield (0, redis_1.ensureRedisConnected)();
                if (!isConnected) {
                    console.warn('Redis client not available or not ready, skipping cache set.');
                    return;
                }
                yield redis_1.redisClient.set(CACHE_KEY, JSON.stringify(movies), {
                    EX: CACHE_EXPIRATION_SECONDS
                });
                console.log('Movies stored in cache.');
            }
            catch (cacheError) {
                console.error('Redis SET error:', cacheError);
                // Don't throw, just log the error
            }
        });
    }
    /**
     * Fetches movie data for the configured number of days,
     * parses HTML, and merges results.
     */
    static _fetchAndParseMovies() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Starting to fetch movies for next ${NUMBER_OF_DAYS_TO_FETCH} days...`);
            const allMovies = new Set();
            const dates = Array.from({ length: NUMBER_OF_DAYS_TO_FETCH }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                return date.toISOString().split('T')[0];
            });
            const moviePromises = dates.map((date) => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Consider adding a short delay or using a library like p-limit
                    // if fetching too rapidly causes issues with the target server.
                    // console.log(`Fetching movies for date: ${date}`);
                    const response = yield fetch(`https://www.cinema.co.il/shown/?date=${date}`);
                    if (!response.ok) {
                        throw new Error(`Fetch failed with status ${response.status} for date ${date}`);
                    }
                    const html = yield response.text();
                    const dom = new jsdom_1.JSDOM(html);
                    return MovieParser_1.MovieParser.parseFromDateHtml(dom.window.document);
                }
                catch (fetchError) {
                    console.error(`Error fetching movies for date ${date}:`, fetchError);
                    return []; // Return empty array for this date on error
                }
            }));
            const moviesArrays = yield Promise.all(moviePromises);
            // Combine results and handle duplicates/merging
            moviesArrays.flat().forEach(movie => {
                const existingMovie = Array.from(allMovies).find(m => m.title === movie.title);
                if (existingMovie) {
                    movie.screenings.forEach(screening => {
                        if (!existingMovie.screenings.some(s => s.dateTime === screening.dateTime && s.venue === screening.venue)) {
                            existingMovie.screenings.push(screening);
                        }
                    });
                }
                else {
                    allMovies.add(movie);
                }
            });
            const moviesResult = Array.from(allMovies);
            console.log(`Total unique movies found: ${moviesResult.length}`);
            return moviesResult;
        });
    }
    /**
     * Deletes the movie cache from Redis.
     */
    static deleteCache(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Ensure Redis is connected (important for serverless environments)
                const isConnected = yield (0, redis_1.ensureRedisConnected)();
                if (!isConnected) {
                    console.warn('Redis client not available or not ready, cannot delete cache.');
                    // Use standard error handling pattern with next()
                    const err = new Error('Cache service unavailable');
                    err.status = 503; // Add status code to error object
                    return next(err); // Forward the error
                }
                const result = yield redis_1.redisClient.del(CACHE_KEY);
                if (result > 0) {
                    console.log(`Cache key '${CACHE_KEY}' deleted successfully.`);
                    res.status(200).json({ message: `Cache key '${CACHE_KEY}' deleted successfully.` });
                }
                else {
                    console.log(`Cache key '${CACHE_KEY}' not found or already deleted.`);
                    res.status(404).json({ message: `Cache key '${CACHE_KEY}' not found.` });
                }
            }
            catch (error) {
                console.error('Error deleting cache:', error);
                // Forward error to Express error handler
                next(error); // Use next for error handling
            }
        });
    }
}
exports.MovieController = MovieController;
