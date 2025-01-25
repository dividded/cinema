package com.example.backend.model

import jakarta.persistence.*

@Entity
@Table(name = "movie_cache")
data class MovieCache(
    @Id
    val id: Int = 1, // Always use ID 1 since we only need one cache entry

    @Column(columnDefinition = "TEXT")
    val moviesJson: String
)
