package com.example.demo.dto;

public class ChangePasswordRequest {
    private String otp;
    private String newPassword;

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
