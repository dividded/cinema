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

        fun parseFromDateHtml(document: Document): List<Movie> {
            val dateText = document.select("span.main-date").text()
                .split(" ")[1]  // "שבת 25.01.25" -> "25.01.25"
                .split(".")     // ["25", "01", "25"]
                .let { parts -> "20${parts[2]}-${parts[1]}-${parts[0]}" }  // "2025-01-25"

            return document.select("div.text-content").map { content ->
                val titleElement = content.select("div.title")
                val yearMatch = titleElement.select("p").text().let { text ->
                    "\\d{4}".toRegex().find(text)?.value?.toIntOrNull()
                }
                
                val description = content.select("div.paragraph p").firstOrNull()?.text() ?: ""
                val altName = description.split("|").getOrNull(1)
                    ?.substringBefore("שלושה")
                    ?.trim()
                    ?.takeIf { it.isNotBlank() }

                val imgUrl = content.parent()
                    ?.select("div.img-wraper img[src$=.jpg]")
                    ?.firstOrNull()
                    ?.attr("src")

                val siteUrl = titleElement.select("h3 a").firstOrNull()?.attr("href")
                
                Movie(
                    title = titleElement.select("h3 a").text().trim(),
                    altName = altName,
                    year = yearMatch,
                    imgUrl = imgUrl,
                    siteUrl = siteUrl,
                    screenings = content.select("a.cal_link span.time")
                        .map { time ->
                            Screening(
                                dateTime = "$dateText ${time.text()}",
                                venue = "Cinematheque TLV"
                            )
                        }.toMutableSet()
                )
            }
        }
    }
} 