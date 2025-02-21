package com.example.backend.service

import com.example.backend.model.Movie
import com.example.backend.model.MovieCache
import com.example.backend.repository.MovieCacheRepository
import com.fasterxml.jackson.core.type.TypeReference
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant

@Service
class MovieCacheService(
    private val movieCacheRepository: MovieCacheRepository,
    private val objectMapper: ObjectMapper = ObjectMapper().registerKotlinModule()
) {
    companion object {
        private val CACHE_DURATION = Duration.ofMinutes(30)
    }

    fun getCachedMovies(): List<Movie>? {
        return try {
            movieCacheRepository.findById(1)
                .filter { !isCacheExpired(it) }
                .map { objectMapper.readValue(it.moviesJson, object : TypeReference<List<Movie>>() {}) }
                .orElse(null)
        } catch (e: Exception) {
            null
        }
    }

    private fun isCacheExpired(cache: MovieCache): Boolean {
        val now = Instant.now()
        val expirationTime = cache.createdAt.plus(CACHE_DURATION)
        return now.isAfter(expirationTime)
    }

    fun cacheMovies(movies: List<Movie>) {
        try {
            val moviesJson = objectMapper.writeValueAsString(movies)
            movieCacheRepository.save(MovieCache(moviesJson = moviesJson))
        } catch (e: Exception) {
            println("Failed to cache movies: ${e.message}")
        }
    }
}
