package com.example.backend.model

data class Movie(
    val title: String,
    val originalTitle: String? = null,
    val year: Int? = null,
    val durationMinutes: Int? = null,
    val screenings: MutableSet<Screening> = mutableSetOf()
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        
        other as Movie
        return title == other.title
    }
    
    override fun hashCode(): Int {
        return title.hashCode()
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