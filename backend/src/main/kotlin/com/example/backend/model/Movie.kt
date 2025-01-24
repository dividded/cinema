package com.example.backend.model

data class Movie(
    val title: String,
    val originalTitle: String? = null,
    val year: Int? = null,
    val durationMinutes: Int? = null,
    val screenings: MutableList<Screening> = mutableListOf()
)

data class Screening(
    val dateTime: String,
    val venue: String,
    val language: String? = null,
    val subtitles: String? = null
) 