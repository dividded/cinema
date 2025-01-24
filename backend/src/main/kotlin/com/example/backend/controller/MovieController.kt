package com.example.backend.controller

import com.example.backend.model.Movie
import com.example.backend.service.MovieService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.CrossOrigin

@RestController
@RequestMapping("/api/movies")
@CrossOrigin(origins = ["http://localhost:5173"])
class MovieController(private val movieService: MovieService) {
    
    @GetMapping
    fun getMovies(): Set<Movie> {
        return movieService.fetchMovies()
    }
} 