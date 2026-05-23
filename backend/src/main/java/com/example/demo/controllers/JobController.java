package com.example.demo.controllers;

import com.example.demo.dto.*;
import com.example.demo.security.JwtUtil;
import com.example.demo.services.JobRecommendationService;
import com.example.demo.services.JobService;
import com.example.demo.services.TalentMatchingService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    @Autowired
    private JobService jobService;

    @Autowired
    private JobRecommendationService jobRecommendationService;

    @Autowired
    private TalentMatchingService talentMatchingService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }

    // 1. Post a new job (Employer only)
    @PostMapping("/employer/{employerId}")
    public ResponseEntity<ApiResponse<JobResponse>> postJob(
            @PathVariable Long employerId,
            @Valid @RequestBody JobRequest request) {
        JobResponse newJob = jobService.postJob(employerId, request);
        ApiResponse<JobResponse> response = new ApiResponse<>(true, "Job posted successfully", newJob);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // 2. Get all active jobs (Job Seekers)
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobResponse>>> getAllActiveJobs() {
        List<JobResponse> jobs = jobService.getAllActiveJobs();
        ApiResponse<List<JobResponse>> response = new ApiResponse<>(true, "Active jobs retrieved", jobs);
        return ResponseEntity.ok(response);
    }

    // 3. Get job by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobResponse>> getJobById(@PathVariable Long id) {
        JobResponse job = jobService.getJobById(id);
        ApiResponse<JobResponse> response = new ApiResponse<>(true, "Job found", job);
        return ResponseEntity.ok(response);
    }

    // 4. Get jobs by employer
    @GetMapping("/employer/{employerId}")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getJobsByEmployer(@PathVariable Long employerId) {
        List<JobResponse> jobs = jobService.getJobsByEmployer(employerId);
        ApiResponse<List<JobResponse>> response = new ApiResponse<>(true, "Jobs by employer retrieved", jobs);
        return ResponseEntity.ok(response);
    }

    // 5. Update job (Employer only)
    @PutMapping("/{jobId}")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @PathVariable Long jobId,
            @RequestBody JobRequest request) {
        JobResponse updatedJob = jobService.updateJob(jobId, request);
        ApiResponse<JobResponse> response = new ApiResponse<>(true, "Job updated successfully", updatedJob);
        return ResponseEntity.ok(response);
    }

    // 6. Delete job (Employer or Admin)
    @DeleteMapping("/{jobId}")
    public ResponseEntity<ApiResponse<Void>> deleteJob(@PathVariable Long jobId) {
        jobService.deleteJob(jobId);
        ApiResponse<Void> response = new ApiResponse<>(true, "Job deleted successfully", null);
        return ResponseEntity.ok(response);
    }

    // 7. Close job (Employer only)
    @PatchMapping("/{jobId}/close")
    public ResponseEntity<ApiResponse<JobResponse>> closeJob(@PathVariable Long jobId) {
        JobResponse closedJob = jobService.closeJob(jobId);
        ApiResponse<JobResponse> response = new ApiResponse<>(true, "Job closed successfully", closedJob);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{jobId}/reopen")
    public ResponseEntity<ApiResponse<JobResponse>> reopenJob(@PathVariable Long jobId) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Job reopened", jobService.reopenJob(jobId)));
    }

    // 8. AI-powered job recommendations for the authenticated job seeker
    @GetMapping("/recommendations")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getRecommendations(HttpServletRequest request) {
        Long userId = getUserId(request);
        List<JobResponse> jobs = userId != null
            ? jobRecommendationService.getRecommendations(userId)
            : List.of();
        return ResponseEntity.ok(new ApiResponse<>(true, "Recommendations fetched", jobs));
    }

    // 9. Search jobs by title
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<JobResponse>>> searchJobs(@RequestParam String keyword) {
        List<JobResponse> jobs = jobService.searchJobs(keyword);
        ApiResponse<List<JobResponse>> response = new ApiResponse<>(true, "Search results", jobs);
        return ResponseEntity.ok(response);
    }

    // 10. AI-matched job seekers for a specific job (employer only)
    @GetMapping("/{jobId}/ai-matches")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAIMatches(@PathVariable Long jobId) {
        List<UserResponse> matches = talentMatchingService.getMatches(jobId);
        return ResponseEntity.ok(new ApiResponse<>(true, "AI matches fetched", matches));
    }
}