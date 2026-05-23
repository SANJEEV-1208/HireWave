package com.example.demo.dto;

import com.example.demo.models.User;
import com.example.demo.models.UserRole;
import java.time.LocalDateTime;
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String phone;
    private UserRole role;
    private LocalDateTime createdAt;
    private String skills;
    private String education;
    private String experience;
    private String resumePath;
    private String companyDescription;
    private String companyWebsite;
    private String companyLogoPath;
    private String profilePicturePath;
    private String githubProfile;

    public UserResponse(User user){
        this.id = user.getId();
        this.email = user.getEmail();
        this.name = user.getName();
        this.phone = user.getPhone();
        this.role = user.getRole();
        this.createdAt = user.getCreatedAt();
        this.skills = user.getSkills();
        this.education = user.getEducation();
        this.experience = user.getExperience();
        this.resumePath = user.getResumePath();
        this.companyDescription = user.getCompanyDescription();
        this.companyWebsite = user.getCompanyWebsite();
        this.companyLogoPath = user.getCompanyLogoPath();
        this.profilePicturePath = user.getProfilePicturePath();
        this.githubProfile = user.getGithubProfile();
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public UserRole getRole() { return role; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getSkills() { return skills; }
    public String getEducation() { return education; }
    public String getExperience() { return experience; }
    public String getResumePath() { return resumePath; }
    public String getCompanyDescription() { return companyDescription; }
    public String getCompanyWebsite() { return companyWebsite; }
    public String getCompanyLogoPath() { return companyLogoPath; }
    public String getProfilePicturePath() { return profilePicturePath; }
    public String getGithubProfile() { return githubProfile; }
}
