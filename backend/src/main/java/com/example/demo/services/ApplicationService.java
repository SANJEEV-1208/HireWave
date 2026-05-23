package com.example.demo.services;

import com.example.demo.dto.ApplicationResponse;
import com.example.demo.dto.UpdateApplicationStatusRequest;
import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.models.Application;
import com.example.demo.models.Job;
import com.example.demo.models.User;
import com.example.demo.repositories.ApplicationRepository;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.example.demo.dto.NotificationResponse;
import com.example.demo.services.NotificationService;
import com.example.demo.services.EmailService;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationService {
    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public ApplicationResponse applyForJob(Long jobId, Long jobSeekerId, MultipartFile resume, boolean useDefaultResume, String coverLetter) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", jobId));
        User jobSeeker = userRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", jobSeekerId));
        if (applicationRepository.existsByJobAndJobSeeker(job, jobSeeker)) {
            throw new RuntimeException("You have already applied for this job");
        }

        Application application = new Application(job, jobSeeker, coverLetter);

        if (resume != null && !resume.isEmpty()) {
            try {
                String filename = fileStorageService.storeFile(resume, "app_" + jobSeekerId);
                application.setResumePath(filename);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store resume file");
            }
        } else if (useDefaultResume && jobSeeker.getResumePath() != null) {
            application.setResumePath(jobSeeker.getResumePath());
        }

        Application saved = applicationRepository.save(application);

        // Notify employer of new application in real-time
        try {
            User employer = job.getEmployer();
            String empTitle = "New Application Received";
            String empMsg = jobSeeker.getName() + " applied for \"" + job.getTitle() + "\"";
            NotificationResponse empNotif = notificationService.createNotification(employer, empTitle, empMsg, saved.getId());
            messagingTemplate.convertAndSendToUser(employer.getId().toString(), "/queue/notifications", empNotif);
        } catch (Exception ignored) {}

        return new ApplicationResponse(saved);
    }

    public List<ApplicationResponse> getApplicationsByJobSeeker(Long jobSeekerId){
        User jobSeeker = userRepository.findById(jobSeekerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", jobSeekerId));
        return applicationRepository.findByJobSeeker(jobSeeker).stream()
                .map(ApplicationResponse::new)
                .collect(Collectors.toList());
    }

    public List<ApplicationResponse> getApplicationsForEmployer(Long employerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new ResourceNotFoundException("Employer", employerId));

        // Get all jobs posted by this employer
        List<Job> employerJobs = jobRepository.findByEmployer(employer);

        // Get all applications for those jobs
        return employerJobs.stream()
                .flatMap(job -> applicationRepository.findByJob(job).stream())
                .map(ApplicationResponse::new)
                .collect(Collectors.toList());
    }

    public ApplicationResponse updateApplicationStatus(Long applicationId, UpdateApplicationStatusRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));

        application.setStatus(request.getStatus());
        Application updatedApplication = applicationRepository.save(application);

        User seeker = updatedApplication.getJobSeeker();
        String jobTitle = updatedApplication.getJob().getTitle();
        String status = request.getStatus();
        String notifTitle = status.equals("ACCEPTED") ? "Application Accepted 🎉" : "Application Update";
        String notifMessage = status.equals("ACCEPTED")
                ? "Congratulations! Your application for \"" + jobTitle + "\" has been accepted."
                : "Your application for \"" + jobTitle + "\" has been reviewed. Status: " + status + ".";
        NotificationResponse notifResponse = notificationService.createNotification(seeker, notifTitle, notifMessage, applicationId);
        emailService.sendStatusUpdate(seeker.getEmail(), seeker.getName(), jobTitle, status);

        // Push real-time notification to job seeker
        try {
            messagingTemplate.convertAndSendToUser(seeker.getId().toString(), "/queue/notifications", notifResponse);
        } catch (Exception ignored) {}

        return new ApplicationResponse(updatedApplication);
    }

    public ApplicationResponse getApplicationById(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));
        return new ApplicationResponse(application);
    }

    public ApplicationResponse updateNotes(Long applicationId, String notes) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", applicationId));
        application.setEmployerNotes(notes);
        return new ApplicationResponse(applicationRepository.save(application));
    }
}
