package com.example.demo.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Setter
    @Getter
    private String title;
    @Setter
    @Getter
    private String description;
    @Setter
    @Getter
    private String company;
    @Setter
    @Getter
    private String location;
    @Setter
    @Getter
    private String salaryRange;

    @Setter
    @Getter
    @ManyToOne
    @JoinColumn(name = "employer_id")
    private User employer;

    @Setter
    @Getter
    private String experience;
    @Setter
    @Getter
    private String workType;
    @Setter
    @Getter
    private String workMode;

    @Setter
    @Getter
    private boolean active;
    @Setter
    @Getter
    private LocalDateTime postedAt;
    @Setter
    @Getter
    private LocalDate deadline;
    @Setter
    @Getter
    private int viewCount = 0;

    @Setter
    @Getter
    @Column(columnDefinition = "TEXT")
    private String requiredSkills;

    public Job() {}

    public Job(String title, String description, String company, String location, User employer) {
        this.title = title;
        this.description = description;
        this.company = company;
        this.location = location;
        this.employer = employer;
        this.postedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

}

