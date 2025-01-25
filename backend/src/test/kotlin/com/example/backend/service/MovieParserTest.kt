package com.example.backend.service

import com.example.backend.model.Movie
import org.assertj.core.api.Assertions.assertThat
import org.jsoup.Jsoup
import org.junit.jupiter.api.Test
import java.io.File
import java.nio.charset.StandardCharsets

class MovieParserTest {
    
    @Test
    fun `should parse movie data from HTML`() {
        // Given
        val htmlContent = File("src/test/resources/sample-movie-page.html")
            .readText(StandardCharsets.UTF_8)
        val document = Jsoup.parse(htmlContent)
        
        // When
        val movies = MovieParser.parse(document)
        
        // Then
        // Print debug information
        println("Found ${movies.size} movies:")
        movies.forEach { movie ->
            println("Movie: ${movie.title}")
            println("Screenings: ${movie.screenings.size}")
            movie.screenings.forEach { screening ->
                println("  - DateTime: ${screening.dateTime}")
                println("  - Venue: ${screening.venue}")
            }
        }
        
        assertThat(movies).isNotEmpty
            .withFailMessage("No movies were parsed from the HTML")
        
        // Check for specific movie
        val dearEvanHansen = movies.find { it.title == "אוון הנסן היקר" }
        assertThat(dearEvanHansen)
            .withFailMessage("Could not find movie 'אוון הנסן היקר' in parsed movies: ${movies.map { it.title }}")
            .isNotNull
        
        // If found, verify it has screenings
        dearEvanHansen?.let {
            assertThat(it.screenings)
                .withFailMessage("No screenings found for 'אוון הנסן היקר'")
                .isNotEmpty
                
            val firstScreening = it.screenings.first()
            assertThat(firstScreening.dateTime)
                .withFailMessage("Screening datetime is blank")
                .isNotBlank()
            assertThat(firstScreening.venue)
                .withFailMessage("Screening venue is blank")
                .isNotBlank()
        }
        
        // Verify no duplicate movies
        val uniqueTitles = movies.map { it.title }.toSet()
        assertThat(uniqueTitles.size)
            .withFailMessage("Found duplicate movies: ${movies.groupBy { it.title }.filter { it.value.size > 1 }.keys}")
            .isEqualTo(movies.size)
    }

    @Test
    fun `should parse movie 'הבעלים לשעבר' from cinema co il correctly`() {
        // Given
        val htmlContent = File("src/test/resources/cinema_co_il_schedule.html")
            .readText(StandardCharsets.UTF_8)
        val document = Jsoup.parse(htmlContent)
        
        // When
        val movies = MovieParser.parseFromDateHtml(document)

        // Then
        val movie = movies.find { it.title == "הבעלים לשעבר" }
        assertThat(movie).isNotNull
            .withFailMessage("Could not find movie 'הבעלים לשעבר' in parsed movies")
        assertThat(movie?.year).isEqualTo(2023)
        assertThat(movie?.altName).isEqualTo("Ex-Husbands")
        assertThat(movie?.imgUrl).isEqualTo("https://www.cinema.co.il/wp-content/uploads/2024/08/הבעלים-לשעבר.jpg")
        assertThat(movie?.siteUrl).isEqualTo("https://www.cinema.co.il/event/%d7%94%d7%91%d7%a2%d7%9c%d7%99%d7%9d-%d7%9c%d7%a9%d7%a2%d7%91%d7%a8/")
        assertThat(movie?.screenings).anySatisfy { screening ->
            assertThat(screening.dateTime).isEqualTo("2025-01-25 11:30")
            assertThat(screening.venue).isEqualTo("Cinematheque TLV")
        }
    }
} 