package com.example.backend.controller

import com.example.backend.model.Movie
import com.example.backend.service.MovieService
import com.example.backend.service.MovieCacheService
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.concurrent.CompletableFuture

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = ["http://localhost:5173"])
class MovieController(
    private val movieService: MovieService,
    private val movieCacheService: MovieCacheService
) {
    
    private val logger = LoggerFactory.getLogger(MovieController::class.java)

    @GetMapping
    fun getMovies(): List<Movie> {
        return movieService.fetchMovies()
    }

    @GetMapping("/cinematheque")
    fun getCinemathequeMovies(): ResponseEntity<List<Movie>> {
        return try {
            // Try to get from cache first
            movieCacheService.getCachedMovies()?.let {
                return ResponseEntity.ok(it)
            }

            // If not in cache, fetch fresh data
            val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            
            val startTime = System.currentTimeMillis()
            logger.info("Starting to fetch movies for next 30 days")

            // Create a list of futures for parallel execution
            val futures = (0..29).map { daysToAdd ->
                CompletableFuture.supplyAsync {
                    val date = LocalDate.now().plusDays(daysToAdd.toLong()).format(formatter)
                    logger.info("Fetching movies for date: $date")
                    val result = movieService.fetchCinemathequeMovies(date)
                    logger.info("Completed fetch for date: $date, found ${result.size} movies")
                    result
                }
            }
            
            // Wait for all futures to complete and combine results
            val allMovies = CompletableFuture.allOf(*futures.toTypedArray())
                .thenApply { futures.flatMap { it.get() } }
                .get()
            
            // Cache the results
            movieCacheService.cacheMovies(allMovies)
            
            CompletableFuture.allOf(*futures.toTypedArray()).thenRun {
                val totalTime = System.currentTimeMillis() - startTime
                logger.info("Completed all fetches in ${totalTime}ms")
            }
            
            ResponseEntity.ok(allMovies)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }
} 