package com.example.demo.dto;

public class TopJobStat {
    private Long jobId;
    private String title;
    private long applications;
    private int views;

    public TopJobStat(Long jobId, String title, long applications, int views) {
        this.jobId = jobId;
        this.title = title;
        this.applications = applications;
        this.views = views;
    }

    public Long getJobId() { return jobId; }
    public String getTitle() { return title; }
    public long getApplications() { return applications; }
    public int getViews() { return views; }
}
