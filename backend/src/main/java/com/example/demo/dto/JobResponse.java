package com.example.demo.dto;

import com.example.demo.models.Job;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class JobResponse {
    private Long id;
    private String title;
    private String description;
    private String company;
    private String location;
    private String salaryRange;
    private String experience;
    private String workType;
    private String workMode;
    private UserResponse employer;
    private boolean active;
    private LocalDateTime postedAt;
    private LocalDate deadline;
    private int viewCount;
    private String requiredSkills;

    public JobResponse(Job job) {
        this.id = job.getId();
        this.title = job.getTitle();
        this.description = job.getDescription();
        this.company = job.getCompany();
        this.location = job.getLocation();
        this.salaryRange = job.getSalaryRange();
        this.experience = job.getExperience();
        this.workType = job.getWorkType();
        this.workMode = job.getWorkMode();
        this.employer = new UserResponse(job.getEmployer());
        this.active = job.isActive();
        this.postedAt = job.getPostedAt();
        this.deadline = job.getDeadline();
        this.viewCount = job.getViewCount();
        this.requiredSkills = job.getRequiredSkills();
    }

    // Getters only
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getCompany() {
        return company;
    }

    public String getLocation() {
        return location;
    }

    public String getSalaryRange() {
        return salaryRange;
    }

    public String getExperience() { return experience; }
    public String getWorkType() { return workType; }
    public String getWorkMode() { return workMode; }

    public UserResponse getEmployer() {
        return employer;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getPostedAt() { return postedAt; }
    public LocalDate getDeadline() { return deadline; }
    public int getViewCount() { return viewCount; }
    public String getRequiredSkills() { return requiredSkills; }
}