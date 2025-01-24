package com.example.backend.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.CrossOrigin

@RestController
@CrossOrigin(origins = ["http://localhost:3000"])
class TestController {
    @GetMapping("/api/test")
    fun test(): String = "Backend is running!"
}