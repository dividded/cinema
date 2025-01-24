package com.example.backend.service

import com.example.backend.model.Movie
import org.jsoup.Jsoup
import org.springframework.stereotype.Service
import java.time.Duration

@Service
class MovieService {
    
    companion object {
        private const val CINEMA_URL = "https://www.cinema.co.il/%D7%97%D7%95%D7%A4%D7%A9%D7%99-%D7%9C%D7%9E%D7%A0%D7%95%D7%99%D7%99%D7%9D/"
    }

    fun fetchMovies(): Set<Movie> {
        val document = Jsoup.connect(CINEMA_URL)
            .timeout(Duration.ofSeconds(10).toMillis().toInt())
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
            .get()
        
        return MovieParser.parse(document)
    }
} 