package com.example.demo.dto;

import com.example.demo.models.Application;
import java.time.LocalDateTime;

public class ApplicationResponse {
    private Long id;
    private JobResponse job;
    private UserResponse jobSeeker;
    private String status;
    private String coverLetter;
    private String resumePath;
    private LocalDateTime appliedAt;
    private String employerNotes;

    public ApplicationResponse(Application application) {
        this.id = application.getId();
        this.job = new JobResponse(application.getJob());
        this.jobSeeker = new UserResponse(application.getJobSeeker());
        this.status = application.getStatus();
        this.coverLetter = application.getCoverLetter();
        this.resumePath = application.getResumePath();
        this.appliedAt = application.getAppliedAt();
        this.employerNotes = application.getEmployerNotes();
    }

    public Long getId() { return id; }
    public JobResponse getJob() { return job; }
    public UserResponse getJobSeeker() { return jobSeeker; }
    public String getStatus() { return status; }
    public String getCoverLetter() { return coverLetter; }
    public String getResumePath() { return resumePath; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public String getEmployerNotes() { return employerNotes; }
}