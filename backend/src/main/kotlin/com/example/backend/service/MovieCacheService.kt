package com.example.backend.service

import com.example.backend.model.Movie
import com.example.backend.model.MovieCache
import com.example.backend.repository.MovieCacheRepository
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.springframework.stereotype.Service

@Service
class MovieCacheService(
    private val movieCacheRepository: MovieCacheRepository,
    private val objectMapper: ObjectMapper = ObjectMapper().registerKotlinModule()
) {
    fun getCachedMovies(): List<Movie>? {
        return try {
            movieCacheRepository.findById(1)
                .map { objectMapper.readValue(it.moviesJson, object : TypeReference<List<Movie>>() {}) }
                .orElse(null)
        } catch (e: Exception) {
            null
        }
    }

    fun cacheMovies(movies: List<Movie>) {
        try {
            val moviesJson = objectMapper.writeValueAsString(movies)
            movieCacheRepository.save(MovieCache(moviesJson = moviesJson))
        } catch (e: Exception) {
            println("Failed to cache movies: ${e.message}")
        }
    }

    fun invalidateCache() {
        movieCacheRepository.deleteAll()
    }
}
