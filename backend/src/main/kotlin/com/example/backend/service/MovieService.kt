package com.example.backend.service

import com.example.backend.model.Movie
import org.jsoup.Jsoup
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class MovieService {
    
    companion object {
        private val CINEMA_URLS = listOf(
            "https://www.cinema.co.il/%D7%97%D7%95%D7%A4%D7%A9%D7%99-%D7%9C%D7%9E%D7%A0%D7%95%D7%99%D7%99%D7%9D/",
            "https://www.cinema.co.il/%d7%98%d7%a8%d7%95%d7%9d-%d7%91%d7%9b%d7%95%d7%a8%d7%94/",
            "https://www.cinema.co.il/%d7%94%d7%a7%d7%a8%d7%a0%d7%95%d7%aa-%d7%a7%d7%91%d7%95%d7%a2%d7%95%d7%aa-2/",
            "https://www.cinema.co.il/%d7%a1%d7%a8%d7%98-%d7%94%d7%a8%d7%a6%d7%90%d7%94/"
        )
    }

    fun fetchMovies(): Set<Movie> {
        val allMovies = mutableSetOf<Movie>()
        
        CINEMA_URLS.forEach { url ->
            try {
                val document = Jsoup.connect(url)
                    .timeout(Duration.ofSeconds(10).toMillis().toInt())
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .get()
                
                val movies = MovieParser.parse(document)
                allMovies.addAll(movies)
            } catch (e: Exception) {
                println("Error fetching URL $url: ${e.message}")
                // Continue with other URLs even if one fails
            }
        }
        
        return allMovies
    }
} 