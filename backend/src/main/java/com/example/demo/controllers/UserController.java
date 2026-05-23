package com.example.demo.controllers;

import com.example.demo.dto.*;
import com.example.demo.services.FileStorageService;
import com.example.demo.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserService userService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private com.example.demo.services.RefreshTokenService refreshTokenService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request){
        UserResponse newUser = userService.registerUser(request);
        ApiResponse<UserResponse> response = new ApiResponse<>(true, "User registered successfully", newUser);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = userService.loginUser(request);
        ApiResponse<AuthResponse> response = new ApiResponse<>(true, "Login Successful", authResponse);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/auth/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleAuth(@RequestBody com.example.demo.dto.GoogleAuthRequest req) {
        AuthResponse auth = userService.googleLogin(req.getCredential(), req.getRole());
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", auth));
    }

    // 3. Get user by ID
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        ApiResponse<UserResponse> response = new ApiResponse<>(true, "User found", user);
        return ResponseEntity.ok(response);
    }

    // 4. Get user by email
    @GetMapping("/email/{email}")
    public ResponseEntity<ApiResponse<UserResponse>> getUserByEmail(@PathVariable String email) {
        UserResponse user = userService.getUserByEmail(email);
        ApiResponse<UserResponse> response = new ApiResponse<>(true, "User found", user);
        return ResponseEntity.ok(response);
    }

    // 5. Get all users (Admin only)
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.getAllUsers();
        ApiResponse<List<UserResponse>> response = new ApiResponse<>(true, "All users retrieved", users);
        return ResponseEntity.ok(response);
    }

    // 6. Get all employers
    @GetMapping("/employers")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllEmployers() {
        List<UserResponse> employers = userService.getAllEmployers();
        ApiResponse<List<UserResponse>> response = new ApiResponse<>(true, "All employers retrieved", employers);
        return ResponseEntity.ok(response);
    }

    // 7. Get all job seekers
    @GetMapping("/job-seekers")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllJobSeekers() {
        List<UserResponse> jobSeekers = userService.getAllJobSeekers();
        ApiResponse<List<UserResponse>> response = new ApiResponse<>(true, "All job seekers retrieved", jobSeekers);
        return ResponseEntity.ok(response);
    }

    // 8. Search users by name or skills, filtered by role (authenticated users only)
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<UserResponse>>> searchUsers(
            @RequestParam String query,
            @RequestParam String role) {
        com.example.demo.models.UserRole userRole = com.example.demo.models.UserRole.valueOf(role.toUpperCase());
        List<UserResponse> results = userService.searchUsers(query, userRole);
        return ResponseEntity.ok(new ApiResponse<>(true, "Search results", results));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id, @RequestBody UpdateUser request){
        UserResponse updatedUser = userService.updateUser(id, request);
        ApiResponse<UserResponse> response = new ApiResponse<>(true, "Updated Successfully", updatedUser);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id){
        userService.deleteUser(id);
        ApiResponse<Void> response = new ApiResponse<>(true, "User Deleted Successfully", null);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping(value = "/{id}/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserResponse>> uploadResume(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        UserResponse user = userService.uploadResume(id, file);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume uploaded successfully", user));
    }

    @GetMapping("/{id}/resume")
    public ResponseEntity<Resource> downloadResume(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserByIdPublic(id);
            if (user.getResumePath() == null) return ResponseEntity.notFound().build();
            Resource resource = fileStorageService.loadAsResource(user.getResumePath());
            String filename = resource.getFilename() != null ? resource.getFilename() : "resume";
            String contentType = filename.endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(value = "/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserResponse>> uploadCompanyLogo(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        UserResponse user = userService.uploadCompanyLogo(id, file);
        return ResponseEntity.ok(new ApiResponse<>(true, "Logo uploaded successfully", user));
    }

    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordSendOtp(@RequestBody java.util.Map<String, String> body) {
        userService.sendPasswordOtpByEmail(body.get("email"));
        return ResponseEntity.ok(new ApiResponse<>(true, "OTP sent to your email", null));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> forgotPasswordReset(@RequestBody java.util.Map<String, String> body) {
        userService.resetPasswordByEmail(body.get("email"), body.get("otp"), body.get("newPassword"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Password reset successfully", null));
    }

    @PostMapping(value = "/{id}/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserResponse>> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        UserResponse user = userService.uploadProfilePicture(id, file);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile picture uploaded successfully", user));
    }

    @GetMapping("/{id}/profile-picture")
    public ResponseEntity<Resource> getProfilePicture(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserByIdPublic(id);
            if (user.getProfilePicturePath() == null) return ResponseEntity.notFound().build();
            Resource resource = fileStorageService.loadAsResource(user.getProfilePicturePath());
            String filename = resource.getFilename() != null ? resource.getFilename() : "profile";
            String contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/profile-picture")
    public ResponseEntity<ApiResponse<UserResponse>> deleteProfilePicture(@PathVariable Long id) {
        UserResponse user = userService.deleteProfilePicture(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Profile picture deleted", user));
    }

    @GetMapping("/{id}/resume/parse")
    public ResponseEntity<ApiResponse<ParsedResumeResponse>> parseResume(@PathVariable Long id) {
        ParsedResumeResponse result = userService.parseResume(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resume parsed", result));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestBody java.util.Map<String, String> body) {
        userService.verifyEmail(body.get("email"), body.get("otp"));
        return ResponseEntity.ok(new ApiResponse<>(true, "Email verified successfully", null));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Void>> resendVerification(@RequestBody java.util.Map<String, String> body) {
        userService.resendVerificationOtp(body.get("email"));
        return ResponseEntity.ok(new ApiResponse<>(true, "OTP resent to your email", null));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@RequestBody RefreshTokenRequest req) {
        AuthResponse auth = userService.refreshAccessToken(req.getRefreshToken());
        return ResponseEntity.ok(new ApiResponse<>(true, "Token refreshed", auth));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestBody(required = false) RefreshTokenRequest req) {
        if (req != null && req.getRefreshToken() != null) {
            refreshTokenService.revokeToken(req.getRefreshToken());
        }
        return ResponseEntity.ok(new ApiResponse<>(true, "Logged out", null));
    }

    @GetMapping("/{id}/logo")
    public ResponseEntity<Resource> getCompanyLogo(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserByIdPublic(id);
            if (user.getCompanyLogoPath() == null) return ResponseEntity.notFound().build();
            Resource resource = fileStorageService.loadAsResource(user.getCompanyLogoPath());
            String filename = resource.getFilename() != null ? resource.getFilename() : "logo";
            String contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
