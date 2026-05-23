package com.example.demo.controllers;

import com.example.demo.dto.*;
import com.example.demo.services.UserService;
import com.example.demo.services.JobService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")  // ← ADD THIS - Only ADMIN can access any endpoint in this controller
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private JobService jobService;

    // 1. Get dashboard statistics
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.getAllUsers().size());
        stats.put("totalEmployers", userService.getAllEmployers().size());
        stats.put("totalJobSeekers", userService.getAllJobSeekers().size());
        stats.put("totalJobs", jobService.getAllActiveJobs().size());

        ApiResponse<Map<String, Object>> response = new ApiResponse<>(true, "Dashboard statistics", stats);
        return ResponseEntity.ok(response);
    }

    // 2. Get all users (with sensitive info for admin)
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        ApiResponse<List<UserResponse>> response = new ApiResponse<>(true, "All users retrieved", users);
        return ResponseEntity.ok(response);
    }

    // 3. Delete any user
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        ApiResponse<Void> response = new ApiResponse<>(true, "User deleted by admin", null);
        return ResponseEntity.ok(response);
    }
}