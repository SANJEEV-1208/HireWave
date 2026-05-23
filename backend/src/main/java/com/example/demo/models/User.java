package com.example.demo.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Setter
    @Getter
    @Column(unique = true, nullable = false)
    private String email;

    @Setter
    @Getter
    private String password;

    @Setter
    @Getter
    @Column(unique = true)
    private String googleId;

    @Setter
    @Getter
    private String name;
    @Setter
    @Getter
    private String phone;

    @Setter
    @Getter
    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Setter
    @Getter
    private LocalDateTime createdAt;

    @Setter
    @Getter
    @Column(columnDefinition = "TEXT")
    private String skills;

    @Setter
    @Getter
    @Column(columnDefinition = "TEXT")
    private String education;

    @Setter
    @Getter
    @Column(columnDefinition = "TEXT")
    private String experience;

    @Setter
    @Getter
    private String resumePath;

    @Setter
    @Getter
    @Column(columnDefinition = "TEXT")
    private String companyDescription;

    @Setter
    @Getter
    private String companyWebsite;

    @Setter
    @Getter
    private String companyLogoPath;

    @Setter
    @Getter
    private String profilePicturePath;

    @Setter
    @Getter
    private String otpCode;

    @Setter
    @Getter
    private LocalDateTime otpExpiresAt;

    @Setter
    @Getter
    @Column(columnDefinition = "boolean default false")
    private boolean emailVerified = false;

    @Setter
    @Getter
    private String githubProfile;

    // Default constructor (required by JPA)
    public User() {}

    // Parameterized constructor
    public User(String email, String name, UserRole role) {
        this.email = email;
        this.name = name;
        this.role = role;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters (generate these)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

}





