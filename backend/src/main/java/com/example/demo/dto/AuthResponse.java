package com.example.demo.dto;

public class AuthResponse {
    private String token;
    private String refreshToken;
    private UserResponse user;

    public AuthResponse(String token, String refreshToken, UserResponse user) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    public String getToken() { return token; }
    public String getRefreshToken() { return refreshToken; }
    public UserResponse getUser() { return user; }
}
