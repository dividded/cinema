package com.example.backend.model

data class Movie(
    // Basic Info
    val title: String,
    val originalTitle: String? = null,
    val altName: String? = null,
    val year: Int? = null,
    
    // Technical Details
    val durationMinutes: Int? = null,
    
    // URLs
    val imgUrl: String? = null,
    val siteUrl: String? = null,
    
    // Screenings
    val screenings: MutableSet<Screening> = mutableSetOf()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false

        other as Movie

        if (title != other.title) return false
        if (year != other.year) return false

        return true
    }

    override fun hashCode(): Int {
        var result = title.hashCode()
        result = 31 * result + (year ?: 0)
        return result
    }
}

data class Screening(
    val dateTime: String,
    val venue: String,
    val language: String? = null,
    val subtitles: String? = null
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        
        other as Screening
        return dateTime == other.dateTime && venue == other.venue
    }
    
    override fun hashCode(): Int {
        var result = dateTime.hashCode()
        result = 31 * result + venue.hashCode()
        return result
    }
} 