package com.example.demo.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api-key:}")
    private String brevoApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private void send(String to, String subject, String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            Map<String, Object> body = Map.of(
                "sender", Map.of("name", "HireWave", "email", "sanjeevsanjee0398@gmail.com"),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "textContent", text
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            restTemplate.postForEntity("https://api.brevo.com/v3/smtp/email", request, String.class);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    public void sendOtp(String toEmail, String name, String otp) {
        send(toEmail,
            "Your HireWave OTP Code",
            "Hi " + (name != null ? name : "there") + ",\n\n" +
            "Your OTP code is: " + otp + "\n\n" +
            "This code is valid for 10 minutes. Do not share it with anyone.\n\n" +
            "If you did not request this, please ignore this email.\n\n" +
            "Best regards,\nHireWave Team"
        );
    }

    public void sendStatusUpdate(String toEmail, String seekerName, String jobTitle, String status) {
        String statusText = status.equals("ACCEPTED") ? "accepted" : "rejected";
        send(toEmail,
            "Your application for \"" + jobTitle + "\" has been " + statusText,
            "Hi " + (seekerName != null ? seekerName : "there") + ",\n\n" +
            "Your application for the position of \"" + jobTitle + "\" has been " + statusText + ".\n\n" +
            (status.equals("ACCEPTED")
                ? "Congratulations! The employer will be in touch with you soon regarding the next steps."
                : "Thank you for your interest. We encourage you to keep applying for other opportunities.") +
            "\n\nBest of luck,\nHireWave Team"
        );
    }
}
