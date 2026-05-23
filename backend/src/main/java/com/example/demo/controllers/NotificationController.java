package com.example.demo.controllers;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.NotificationResponse;
import com.example.demo.security.JwtUtil;
import com.example.demo.services.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(authHeader.substring(7));
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotifications(HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        List<NotificationResponse> notifications = notificationService.getForUser(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Notifications retrieved", notifications));
    }

    @PutMapping("/mark-read")
    public ResponseEntity<ApiResponse<Void>> markAllRead(HttpServletRequest request) {
        Long userId = getUserIdFromRequest(request);
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Marked as read", null));
    }
}
