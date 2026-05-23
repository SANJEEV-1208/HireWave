package com.example.demo.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class Application {
    @Getter
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Getter
    @Setter
    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Getter
    @Setter
    @ManyToOne
    @JoinColumn(name = "job_seeker_id", nullable = false)
    private User jobSeeker;

    @Getter
    @Setter
    private String status;

    @Getter
    @Setter
    @Column(length = 2000)
    private String coverLetter;

    @Getter
    @Setter
    private String resumePath;

    @Getter
    @Setter
    private LocalDateTime appliedAt;

    @Getter
    @Setter
    @Column(columnDefinition = "TEXT")
    private String employerNotes;

    public Application(){}

    public Application(Job job, User jobSeeker, String coverLetter) {
        this.job = job;
        this.jobSeeker = jobSeeker;
        this.coverLetter = coverLetter;
        this.status = "PENDING";
        this.appliedAt = LocalDateTime.now();
    }
}
