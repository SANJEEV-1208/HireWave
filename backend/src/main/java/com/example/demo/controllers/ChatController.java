package com.example.demo.controllers;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.ChatRequest;
import com.example.demo.security.JwtUtil;
import com.example.demo.services.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> chat(@RequestBody ChatRequest request) {
        String reply = chatService.chat(request.getMessage());
        return ResponseEntity.ok(new ApiResponse<>(true, "OK", reply));
    }

    @PostMapping("/cover-letter")
    public ResponseEntity<ApiResponse<String>> coverLetter(
            @RequestParam Long jobId, HttpServletRequest request) {
        Long userId = getUserId(request);
        String letter = chatService.generateCoverLetter(userId, jobId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Cover letter generated", letter));
    }
}
