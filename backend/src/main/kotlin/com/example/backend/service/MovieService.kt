package com.example.backend.service

import com.example.backend.model.Movie
import org.jsoup.Jsoup
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.time.Duration
import java.lang.RuntimeException

@Service
class MovieService(private val movieParser: MovieParser) {
    private val logger = LoggerFactory.getLogger(MovieService::class.java)
    
    companion object {
        private val CINEMA_URLS = listOf(
            "https://www.cinema.co.il/%D7%97%D7%95%D7%A4%D7%A9%D7%99-%D7%9C%D7%9E%D7%A0%D7%95%D7%99%D7%99%D7%9D/",
            "https://www.cinema.co.il/%d7%98%d7%a8%d7%95%d7%9d-%d7%91%d7%9b%d7%95%d7%a8%d7%94/",
            "https://www.cinema.co.il/%d7%94%d7%a7%d7%a8%d7%a0%d7%95%d7%aa-%d7%a7%d7%91%d7%95%d7%a2%d7%95%d7%aa-2/",
            "https://www.cinema.co.il/%d7%a1%d7%a8%d7%98-%d7%94%d7%a8%d7%a6%d7%90%d7%94/"
        )
    }

    fun fetchMovies(): List<Movie> {
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
            }
        }
        return allMovies.toList()
    }

    fun fetchCinemathequeMovies(date: String): List<Movie> {
        try {
            val document = Jsoup.connect("https://www.cinema.co.il/shown/?date=$date")
                .userAgent("Mozilla/5.0")
                .timeout(10000)
                .get()
            return MovieParser.parseFromDateHtml(document)
        } catch (e: Exception) {
            throw RuntimeException("Failed to fetch or parse cinematheque movies", e)
        }
    }

    fun fetchAndParseMovies(forceRefresh: Boolean = false): List<Movie> {
        logger.info("Fetching movies from external site. Force refresh: $forceRefresh")
        
        try {
            val document = Jsoup.connect("https://www.cinema.co.il/shows/cinematheque-tlv/")
                .get()
            logger.info("Successfully fetched HTML from external site")
            
            val movies = MovieParser.parse(document)
            logger.info("Parsed ${movies.size} movies from the fetched HTML")
            return movies.toList()
            
        } catch (e: Exception) {
            logger.error("Error fetching or parsing movies: ${e.message}", e)
            throw e
        }
    }
}