package com.example.backend.repository

import com.example.backend.model.MovieCache
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MovieCacheRepository : JpaRepository<MovieCache, Int>
