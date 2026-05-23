package com.example.demo.controllers;

import com.example.demo.dto.*;
import com.example.demo.services.ApplicationService;
import com.example.demo.services.FileStorageService;
import com.example.demo.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(authHeader.substring(7));
        }
        return null;
    }

    // 1. Apply for a job — multipart (resume optional)
    @PostMapping(value = "/apply/{jobId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ApplicationResponse>> applyForJob(
            @PathVariable Long jobId,
            @RequestParam(value = "resume", required = false) MultipartFile resume,
            @RequestParam(value = "useDefaultResume", defaultValue = "false") boolean useDefaultResume,
            @RequestParam(value = "coverLetter", required = false) String coverLetter,
            HttpServletRequest httpRequest) {

        Long jobSeekerId = getUserIdFromRequest(httpRequest);
        ApplicationResponse application = applicationService.applyForJob(jobId, jobSeekerId, resume, useDefaultResume, coverLetter);
        ApiResponse<ApplicationResponse> response = new ApiResponse<>(true, "Application submitted successfully", application);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // Resume download for an application (employer views applicant resume)
    @GetMapping("/{applicationId}/resume")
    public ResponseEntity<Resource> getApplicationResume(@PathVariable Long applicationId) {
        try {
            ApplicationResponse app = applicationService.getApplicationById(applicationId);
            if (app.getResumePath() == null) return ResponseEntity.notFound().build();
            Resource resource = fileStorageService.loadAsResource(app.getResumePath());
            String filename = resource.getFilename() != null ? resource.getFilename() : "resume";
            String contentType = filename.endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 2. Get all applications for current job seeker (Job Seeker only)
    @GetMapping("/my-applications")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getMyApplications(HttpServletRequest httpRequest) {
        Long jobSeekerId = getUserIdFromRequest(httpRequest);
        List<ApplicationResponse> applications = applicationService.getApplicationsByJobSeeker(jobSeekerId);
        ApiResponse<List<ApplicationResponse>> response = new ApiResponse<>(true, "Your applications", applications);
        return ResponseEntity.ok(response);
    }

    // 3. Get all applications for employer's jobs (Employer only)
    @GetMapping("/employer/applications")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplicationsForEmployer(HttpServletRequest httpRequest) {
        Long employerId = getUserIdFromRequest(httpRequest);
        List<ApplicationResponse> applications = applicationService.getApplicationsForEmployer(employerId);
        ApiResponse<List<ApplicationResponse>> response = new ApiResponse<>(true, "Applications received", applications);
        return ResponseEntity.ok(response);
    }

    // 4. Update application status (Employer only)
    @PutMapping("/{applicationId}/status")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateApplicationStatus(
            @PathVariable Long applicationId,
            @Valid @RequestBody UpdateApplicationStatusRequest request) {

        ApplicationResponse application = applicationService.updateApplicationStatus(applicationId, request);
        ApiResponse<ApplicationResponse> response = new ApiResponse<>(true, "Application status updated", application);
        return ResponseEntity.ok(response);
    }

    // 5. Get application by ID (Both Job Seeker and Employer can view)
    @GetMapping("/{applicationId}")
    public ResponseEntity<ApiResponse<ApplicationResponse>> getApplicationById(@PathVariable Long applicationId) {
        ApplicationResponse application = applicationService.getApplicationById(applicationId);
        ApiResponse<ApplicationResponse> response = new ApiResponse<>(true, "Application found", application);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{applicationId}/notes")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateNotes(
            @PathVariable Long applicationId,
            @RequestBody java.util.Map<String, String> body) {
        ApplicationResponse application = applicationService.updateNotes(applicationId, body.get("notes"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Notes saved", application));
    }
}