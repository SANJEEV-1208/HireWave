package com.example.demo.controllers;

import com.example.demo.dto.*;
import com.example.demo.security.JwtUtil;
import com.example.demo.services.AnalyticsService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired private AnalyticsService analyticsService;
    @Autowired private JwtUtil jwtUtil;

    private Long getEmployerIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(authHeader.substring(7));
        }
        return null;
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AnalyticsSummaryResponse>> getSummary(HttpServletRequest request) {
        Long employerId = getEmployerIdFromRequest(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Summary", analyticsService.getSummary(employerId)));
    }

    @GetMapping("/applications-over-time")
    public ResponseEntity<ApiResponse<List<DailyApplicationCount>>> getApplicationsOverTime(HttpServletRequest request) {
        Long employerId = getEmployerIdFromRequest(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Applications over time",
                analyticsService.getApplicationsOverTime(employerId)));
    }

    @GetMapping("/status-distribution")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatusDistribution(HttpServletRequest request) {
        Long employerId = getEmployerIdFromRequest(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Status distribution",
                analyticsService.getStatusDistribution(employerId)));
    }

    @GetMapping("/top-jobs")
    public ResponseEntity<ApiResponse<List<TopJobStat>>> getTopJobs(HttpServletRequest request) {
        Long employerId = getEmployerIdFromRequest(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Top jobs",
                analyticsService.getTopJobs(employerId)));
    }
}
