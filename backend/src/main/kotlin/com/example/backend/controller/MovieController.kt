package com.example.backend.controller

import com.example.backend.model.Movie
import com.example.backend.service.MovieService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = ["http://localhost:5173"])
class MovieController(private val movieService: MovieService) {
    
    @GetMapping
    fun getMovies(): Set<Movie> {
        return movieService.fetchMovies()
    }

    @GetMapping("/cinematheque")
    fun getCinemathequeMovies(): ResponseEntity<List<Movie>> {
        return try {
            val allMovies = mutableListOf<Movie>()
            val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
            
            // Fetch movies for today and next 4 days
            (0..4).forEach { daysToAdd ->
                val date = LocalDate.now().plusDays(daysToAdd.toLong()).format(formatter)
                val moviesForDate = movieService.fetchCinemathequeMovies(date)
                allMovies.addAll(moviesForDate)
            }
            
            ResponseEntity.ok(allMovies)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
        }
    }

    @PostMapping("/cinematheque/invalidate")
    fun invalidateAndRefetch(): ResponseEntity<List<Movie>> {
        return getCinemathequeMovies()
    }
} 