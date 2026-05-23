package com.example.demo.services;

import com.example.demo.dto.*;
import com.example.demo.exceptions.DuplicateResourceException;
import com.example.demo.exceptions.ResourceNotFoundException;
import com.example.demo.exceptions.InvalidCredentialsException;
import com.example.demo.models.User;
import com.example.demo.models.UserRole;
import com.example.demo.repositories.UserRepository;
import com.example.demo.security.JwtUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ResumeParserService resumeParserService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Value("${google.client-id}")
    private String googleClientId;

    // Register a new user
    public UserResponse registerUser(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email", request.getEmail());
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setName(request.getName());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Will add encoding later
        user.setRole(UserRole.valueOf(request.getRole().toUpperCase()));
        user.setCreatedAt(LocalDateTime.now());

        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        User savedUser = userRepository.save(user);
        emailService.sendOtp(savedUser.getEmail(), savedUser.getName(), otp);
        return new UserResponse(savedUser);
    }

    // Get user by ID
    public UserResponse getUserById(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", auth.getName()));
        User targetUser = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isEmployer = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYER"));
        boolean isOwnProfile = currentUser.getId().equals(id);
        boolean isEmployerViewingSeeker = isEmployer && targetUser.getRole() == UserRole.JOB_SEEKER;
        if (!isOwnProfile && !isAdmin && !isEmployerViewingSeeker) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return new UserResponse(targetUser);
    }

    // Get user by ID without auth check (used for public endpoints like logo)
    public UserResponse getUserByIdPublic(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return new UserResponse(user);
    }

    // Get user by email
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        return new UserResponse(user);
    }

    // Get all users
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }

    // Get all employers
    public List<UserResponse> getAllEmployers() {
        return userRepository.findByRole(UserRole.EMPLOYER).stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }

    // Get all job seekers
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getAllJobSeekers() {
        return userRepository.findByRole(UserRole.JOB_SEEKER).stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }

    // Search users by name or skills, filtered by role
    public List<UserResponse> searchUsers(String query, UserRole role) {
        if (query == null || query.trim().isEmpty()) return Collections.emptyList();
        return userRepository.searchByRoleAndQuery(role, query.trim())
                .stream()
                .map(UserResponse::new)
                .collect(Collectors.toList());
    }

    // Update user
    public UserResponse updateUser(Long id, UpdateUser request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", auth.getName()));
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!currentUser.getId().equals(id) && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        if (request.getName() != null && !request.getName().isEmpty()) {
            user.setName(request.getName());
        }
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            user.setPhone(request.getPhone());
        }
        if (request.getSkills() != null) {
            user.setSkills(request.getSkills());
        }
        if (request.getEducation() != null) {
            user.setEducation(request.getEducation());
        }
        if (request.getExperience() != null) {
            user.setExperience(request.getExperience());
        }
        if (request.getCompanyDescription() != null) {
            user.setCompanyDescription(request.getCompanyDescription());
        }
        if (request.getCompanyWebsite() != null) {
            user.setCompanyWebsite(request.getCompanyWebsite());
        }
        if (request.getGithubProfile() != null) {
            user.setGithubProfile(request.getGithubProfile());
        }

        return new UserResponse(userRepository.save(user));
    }

    // Delete user
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        userRepository.delete(user);
    }

    public AuthResponse loginUser(LoginRequest request) {
        // Find user by email (automatically throws ResourceNotFoundException if not found)
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getEmail()));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }
        if (!user.isEmailVerified() && user.getGoogleId() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                HttpStatus.FORBIDDEN, "Please verify your email before logging in");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();
        return new AuthResponse(token, refreshToken, new UserResponse(user));
    }

    public AuthResponse googleLogin(String credential, String roleStr) {
        // Verify Google ID token
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken;
        try {
            idToken = verifier.verify(credential);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }
        if (idToken == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        // Find existing user by googleId, then by email, or create new
        User user = userRepository.findByGoogleId(googleId).orElseGet(() ->
                userRepository.findByEmail(email).map(existing -> {
                    existing.setGoogleId(googleId);
                    return userRepository.save(existing);
                }).orElseGet(() -> {
                    UserRole role = UserRole.JOB_SEEKER;
                    if (roleStr != null && !roleStr.isBlank()) {
                        try { role = UserRole.valueOf(roleStr.toUpperCase()); } catch (IllegalArgumentException ignored) {}
                    }
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(name != null ? name : email);
                    newUser.setGoogleId(googleId);
                    newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
                    newUser.setRole(role);
                    newUser.setCreatedAt(LocalDateTime.now());
                    return userRepository.save(newUser);
                })
        );

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();
        return new AuthResponse(token, refreshToken, new UserResponse(user));
    }

    public UserResponse uploadCompanyLogo(Long id, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (user.getCompanyLogoPath() != null) {
            fileStorageService.deleteFile(user.getCompanyLogoPath());
        }
        try {
            String filename = fileStorageService.storeFile(file, "logo_" + id);
            user.setCompanyLogoPath(filename);
            return new UserResponse(userRepository.save(user));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store company logo");
        }
    }

    public void sendPasswordOtpByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        String otp = String.format("%06d", new Random().nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendOtp(user.getEmail(), user.getName(), otp);
    }

    public void resetPasswordByEmail(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No OTP was requested. Please request an OTP first.");
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired. Please request a new one.");
        }
        if (!user.getOtpCode().equals(otp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect OTP. Please try again.");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);
    }

    public UserResponse uploadProfilePicture(Long id, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (user.getProfilePicturePath() != null) {
            fileStorageService.deleteFile(user.getProfilePicturePath());
        }
        try {
            String filename = fileStorageService.storeFile(file, "profile_" + id);
            user.setProfilePicturePath(filename);
            return new UserResponse(userRepository.save(user));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store profile picture");
        }
    }

    public UserResponse deleteProfilePicture(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (user.getProfilePicturePath() != null) {
            fileStorageService.deleteFile(user.getProfilePicturePath());
            user.setProfilePicturePath(null);
            userRepository.save(user);
        }
        return new UserResponse(user);
    }

    public ParsedResumeResponse parseResume(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (user.getResumePath() == null) {
            return new ParsedResumeResponse(Collections.emptyList(), "No resume uploaded yet.");
        }
        if (!user.getResumePath().toLowerCase().endsWith(".pdf")) {
            return new ParsedResumeResponse(Collections.emptyList(), "Only PDF resumes can be parsed.");
        }
        try {
            Resource resource = fileStorageService.loadAsResource(user.getResumePath());
            byte[] bytes;
            try (var stream = resource.getInputStream()) {
                bytes = stream.readAllBytes();
            }
            List<String> skills = resumeParserService.parseFromBytes(bytes);
            String msg = skills.isEmpty() ? "No recognizable skills detected in your resume." : null;
            return new ParsedResumeResponse(skills, msg);
        } catch (Exception e) {
            return new ParsedResumeResponse(Collections.emptyList(), "Failed to read resume file.");
        }
    }

    public UserResponse uploadResume(Long id, MultipartFile file) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (user.getResumePath() != null) {
            fileStorageService.deleteFile(user.getResumePath());
        }
        try {
            String filename = fileStorageService.storeFile(file, "user_" + id);
            user.setResumePath(filename);
            return new UserResponse(userRepository.save(user));
        } catch (IOException e) {
            throw new RuntimeException("Failed to store resume");
        }
    }

    public void verifyEmail(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        if (user.isEmailVerified()) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already verified");
        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null)
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "No OTP requested");
        if (LocalDateTime.now().isAfter(user.getOtpExpiresAt()))
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP has expired");
        if (!user.getOtpCode().equals(otp))
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect OTP");
        user.setEmailVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);
    }

    public void resendVerificationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        if (user.isEmailVerified()) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already verified");
        String otp = String.format("%06d", new Random().nextInt(1000000));
        user.setOtpCode(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);
        emailService.sendOtp(email, user.getName(), otp);
    }

    public AuthResponse refreshAccessToken(String refreshTokenStr) {
        com.example.demo.models.RefreshToken refreshToken = refreshTokenService.validateToken(refreshTokenStr)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"));
        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "User not found"));
        String newAccessToken = jwtUtil.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        refreshTokenService.revokeToken(refreshTokenStr);
        String newRefreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();
        return new AuthResponse(newAccessToken, newRefreshToken, new UserResponse(user));
    }
}