package com.example.demo.dto;

import java.util.List;

public class ParsedResumeResponse {
    private List<String> detectedSkills;
    private String message;

    public ParsedResumeResponse(List<String> detectedSkills, String message) {
        this.detectedSkills = detectedSkills;
        this.message = message;
    }

    public List<String> getDetectedSkills() { return detectedSkills; }
    public String getMessage() { return message; }
}
