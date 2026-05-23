package com.example.demo.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendOtp(String toEmail, String name, String otp) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject("🔐 Your JobPortal Password Reset OTP");
            msg.setText(
                "Hi " + (name != null ? name : "there") + ",\n\n" +
                "You requested a password change on JobPortal.\n\n" +
                "Your OTP is: " + otp + "\n\n" +
                "This OTP is valid for 10 minutes. Do not share it with anyone.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Best regards,\nJobPortal Team"
            );
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email to " + toEmail + ": " + e.getMessage());
        }
    }

    public void sendStatusUpdate(String toEmail, String seekerName, String jobTitle, String status) {
        try {
            String statusText = status.equals("ACCEPTED") ? "accepted" : "rejected";
            String emoji = status.equals("ACCEPTED") ? "🎉" : "📋";
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(toEmail);
            msg.setSubject(emoji + " Your application for \"" + jobTitle + "\" has been " + statusText);
            msg.setText(
                "Hi " + (seekerName != null ? seekerName : "there") + ",\n\n" +
                "We wanted to let you know that your application for the position of \"" + jobTitle + "\" " +
                "has been " + statusText + ".\n\n" +
                (status.equals("ACCEPTED")
                    ? "Congratulations! The employer will be in touch with you soon regarding the next steps."
                    : "Thank you for your interest. We encourage you to keep applying for other opportunities.") +
                "\n\nBest of luck,\nJobPortal Team"
            );
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
        }
    }
}
