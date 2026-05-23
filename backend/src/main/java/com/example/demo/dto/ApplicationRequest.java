package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ApplicationRequest {

    @NotBlank(message = "Cover letter is required")
    @Size(min = 20, max = 2000, message = "Cover letter must be between 20 and 2000 characters")
    private String coverLetter;

    // Getter and Setter
    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }
}