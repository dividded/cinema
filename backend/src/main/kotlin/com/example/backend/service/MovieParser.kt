package com.example.backend.service

import com.example.backend.model.Movie
import com.example.backend.model.Screening
import org.jsoup.nodes.Document
import org.springframework.stereotype.Service

@Service
class MovieParser {
    companion object {
        fun parse(document: Document): Set<Movie> {
            val movieMap = mutableMapOf<String, Movie>()
            
            // Find all movie blocks
            document.select("div.title").forEach { titleDiv ->
                // Extract movie title
                val title = titleDiv.select("h3").text().trim()
                
                // Get or create movie
                val movie = movieMap.getOrPut(title) { Movie(title = title) }
                
                // Extract screening details
                titleDiv.select("div.n_block_r").forEach { screeningBlock ->
                    val screeningText = screeningBlock.select("p").text().trim()
                    
                    // Parse screening details (format: "25-01-2025 | שבת | 11:00")
                    val screeningParts = screeningText.split("|").map { it.trim() }
                    if (screeningParts.size >= 3) {
                        val screening = Screening(
                            dateTime = "${screeningParts[0]} ${screeningParts[2]}", // Combine date and time
                            venue = "סינמטק תל אביב"
                        )
                        movie.screenings.add(screening)
                    }
                }
            }
            
            return movieMap.values.toSet()
        }
    }
} 