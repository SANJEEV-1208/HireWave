package com.example.demo.dto;

public class AnalyticsSummaryResponse {
    private int totalJobsPosted;
    private int activeJobs;
    private long totalApplications;
    private long totalViews;

    public AnalyticsSummaryResponse(int totalJobsPosted, int activeJobs, long totalApplications, long totalViews) {
        this.totalJobsPosted = totalJobsPosted;
        this.activeJobs = activeJobs;
        this.totalApplications = totalApplications;
        this.totalViews = totalViews;
    }

    public int getTotalJobsPosted() { return totalJobsPosted; }
    public int getActiveJobs() { return activeJobs; }
    public long getTotalApplications() { return totalApplications; }
    public long getTotalViews() { return totalViews; }
}
