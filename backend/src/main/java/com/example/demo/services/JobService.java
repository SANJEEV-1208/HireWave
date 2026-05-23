package com.example.demo.services;

import com.example.demo.dto.JobRequest;
import com.example.demo.dto.JobResponse;
import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.models.Job;
import com.example.demo.models.JobView;
import com.example.demo.models.User;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.JobViewRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobViewRepository jobViewRepository;

    // Post a new job
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobResponse postJob(Long employerId, JobRequest request) {
        System.out.println("=== DEBUG: postJob method called ===");
        System.out.println("=== DEBUG: Current authentication: " + SecurityContextHolder.getContext().getAuthentication());
        System.out.println("=== DEBUG: Current authorities: " + SecurityContextHolder.getContext().getAuthentication().getAuthorities());
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", employerId));

        Job job = new Job();
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setCompany(request.getCompany());
        job.setLocation(request.getLocation());
        job.setSalaryRange(request.getSalaryRange());
        job.setExperience(request.getExperience());
        job.setWorkType(request.getWorkType());
        job.setWorkMode(request.getWorkMode());
        job.setDeadline(request.getDeadline());
        job.setRequiredSkills(request.getRequiredSkills());
        job.setEmployer(employer);
        job.setActive(true);
        job.setPostedAt(LocalDateTime.now());

        return new JobResponse(jobRepository.save(job));
    }

    // Get all active jobs (excluding past-deadline jobs)
    public List<JobResponse> getAllActiveJobs() {
        LocalDate today = LocalDate.now();
        return jobRepository.findByActiveTrue().stream()
                .filter(j -> j.getDeadline() == null || !j.getDeadline().isBefore(today))
                .map(JobResponse::new)
                .collect(Collectors.toList());
    }

    // Get job by ID — counts only unique authenticated non-employer views
    public JobResponse getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job", id));

        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                Optional<User> viewerOpt = userRepository.findByEmail(auth.getName());
                if (viewerOpt.isPresent()) {
                    User viewer = viewerOpt.get();
                    boolean isOwnJob = viewer.getId().equals(job.getEmployer().getId());
                    if (!isOwnJob && !jobViewRepository.existsByJobIdAndViewerId(id, viewer.getId())) {
                        JobView view = new JobView();
                        view.setJobId(id);
                        view.setViewerId(viewer.getId());
                        view.setViewedAt(LocalDateTime.now());
                        jobViewRepository.save(view);
                        jobRepository.incrementViewCount(id);
                        job.setViewCount(job.getViewCount() + 1);
                    }
                }
            }
        } catch (Exception ignored) {}

        return new JobResponse(job);
    }

    // Get jobs by employer
    public List<JobResponse> getJobsByEmployer(Long employerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", employerId));
        return jobRepository.findByEmployer(employer).stream()
                .map(JobResponse::new)
                .collect(Collectors.toList());
    }

    // Update job
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobResponse updateJob(Long jobId, JobRequest request) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));

        if (request.getTitle() != null) job.setTitle(request.getTitle());
        if (request.getDescription() != null) job.setDescription(request.getDescription());
        if (request.getLocation() != null) job.setLocation(request.getLocation());
        if (request.getSalaryRange() != null) job.setSalaryRange(request.getSalaryRange());
        if (request.getExperience() != null) job.setExperience(request.getExperience());
        if (request.getWorkType() != null) job.setWorkType(request.getWorkType());
        if (request.getWorkMode() != null) job.setWorkMode(request.getWorkMode());
        if (request.getDeadline() != null) job.setDeadline(request.getDeadline());
        if (request.getRequiredSkills() != null) job.setRequiredSkills(request.getRequiredSkills());

        return new JobResponse(jobRepository.save(job));
    }

    // Delete job
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        jobRepository.delete(job);
    }

    // Close job
    @PreAuthorize("hasRole('EMPLOYER')")
    public JobResponse closeJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        job.setActive(false);
        return new JobResponse(jobRepository.save(job));
    }

    public JobResponse reopenJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        job.setActive(true);
        return new JobResponse(jobRepository.save(job));
    }

    // Search jobs
    public List<JobResponse> searchJobs(String keyword) {
        return jobRepository.findByTitleContainingIgnoreCase(keyword).stream()
                .map(JobResponse::new)
                .collect(Collectors.toList());
    }
}