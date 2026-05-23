package com.example.demo.controllers;

import com.example.demo.dto.ApiResponse;
import com.example.demo.security.JwtUtil;
import com.example.demo.services.ProfileViewService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile-views")
public class ProfileViewController {

    @Autowired
    private ProfileViewService profileViewService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) return jwtUtil.extractUserId(auth.substring(7));
        return null;
    }

    @PostMapping("/{seekerId}")
    public ResponseEntity<ApiResponse<Void>> recordView(@PathVariable Long seekerId, HttpServletRequest request) {
        Long viewerId = getUserId(request);
        if (viewerId != null) profileViewService.recordView(viewerId, seekerId);
        return ResponseEntity.ok(new ApiResponse<>(true, "View recorded", null));
    }
}
