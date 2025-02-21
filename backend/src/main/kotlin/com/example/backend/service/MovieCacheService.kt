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
import kotlin.random.Random

@Service
class MovieCacheService(
    private val movieCacheRepository: MovieCacheRepository,
    private val objectMapper: ObjectMapper = ObjectMapper().registerKotlinModule()
) {
    companion object {
        private const val MIN_CACHE_MINUTES = 30L
        private const val MAX_CACHE_MINUTES = 45L
        
        private fun getRandomCacheDuration(): Duration {
            val minutes = Random.nextLong(MIN_CACHE_MINUTES, MAX_CACHE_MINUTES + 1)
            return Duration.ofMinutes(minutes)
        }
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
        val cacheDuration = getRandomCacheDuration()
        val expirationTime = cache.createdAt.plus(cacheDuration)
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
