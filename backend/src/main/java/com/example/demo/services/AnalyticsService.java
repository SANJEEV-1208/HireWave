package com.example.demo.services;

import com.example.demo.dto.AnalyticsSummaryResponse;
import com.example.demo.dto.DailyApplicationCount;
import com.example.demo.dto.TopJobStat;
import com.example.demo.models.Job;
import com.example.demo.models.User;
import com.example.demo.repositories.ApplicationRepository;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class AnalyticsService {

    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private JobRepository jobRepository;
    @Autowired private UserRepository userRepository;

    public AnalyticsSummaryResponse getSummary(Long employerId) {
        User employer = userRepository.findById(employerId).orElseThrow();
        List<Job> allJobs = jobRepository.findByEmployer(employer);
        List<Job> activeJobs = jobRepository.findByEmployerAndActiveTrue(employer);
        long totalApplications = applicationRepository.countByEmployerId(employerId);
        long totalViews = allJobs.stream().mapToLong(Job::getViewCount).sum();
        return new AnalyticsSummaryResponse(allJobs.size(), activeJobs.size(), totalApplications, totalViews);
    }

    public List<DailyApplicationCount> getApplicationsOverTime(Long employerId) {
        LocalDateTime from = LocalDate.now().minusDays(29).atStartOfDay();
        List<Object[]> raw = applicationRepository.countApplicationsByDayForEmployer(employerId, from);

        Map<String, Long> byDate = new LinkedHashMap<>();
        for (Object[] row : raw) {
            String dateStr = row[0].toString().substring(0, 10);
            long count = ((Number) row[1]).longValue();
            byDate.put(dateStr, count);
        }

        List<DailyApplicationCount> result = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 29; i >= 0; i--) {
            String d = today.minusDays(i).toString();
            result.add(new DailyApplicationCount(d, byDate.getOrDefault(d, 0L)));
        }
        return result;
    }

    public Map<String, Long> getStatusDistribution(Long employerId) {
        List<Object[]> raw = applicationRepository.statusDistributionForEmployer(employerId);
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : raw) {
            result.put((String) row[0], ((Number) row[1]).longValue());
        }
        return result;
    }

    public List<TopJobStat> getTopJobs(Long employerId) {
        List<Object[]> raw = applicationRepository.topJobsByApplicationsForEmployer(employerId);
        List<TopJobStat> result = new ArrayList<>();
        for (Object[] row : raw) {
            Long jobId = ((Number) row[0]).longValue();
            String title = (String) row[1];
            long applications = ((Number) row[2]).longValue();
            int views = ((Number) row[3]).intValue();
            result.add(new TopJobStat(jobId, title, applications, views));
            if (result.size() == 5) break;
        }
        return result;
    }
}
