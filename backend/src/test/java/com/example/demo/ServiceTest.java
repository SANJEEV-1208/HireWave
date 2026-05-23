package com.example.demo;

import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.RegisterRequest;
import com.example.demo.dto.UpdateUser;
import com.example.demo.dto.UserResponse;
import com.example.demo.services.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class ServiceTest {

    @Autowired
    private UserService userService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private static int testCounter = 0;

    @BeforeEach
    void setUp() {
        // Create UNIQUE email for each test to avoid duplicate errors
        testCounter++;
        String uniqueEmail = "test" + System.currentTimeMillis() + "_" + testCounter + "@example.com";

        // Setup Register Request
        registerRequest = new RegisterRequest();
        registerRequest.setEmail(uniqueEmail);
        registerRequest.setName("Test User");
        registerRequest.setPassword("password123");
        registerRequest.setRole("JOB_SEEKER");

        // Setup Login Request (using the same unique email)
        loginRequest = new LoginRequest();
        loginRequest.setEmail(uniqueEmail);
        loginRequest.setPassword("password123");
    }

    @Test
    public void testRegisterUser() {
        System.out.println("=== Test: Register User ===");
        System.out.println("Email being used: " + registerRequest.getEmail());

        UserResponse user = userService.registerUser(registerRequest);

        assertNotNull(user.getId());
        assertEquals(registerRequest.getEmail(), user.getEmail());
        assertEquals("Test User", user.getName());

        System.out.println("✅ User registered with ID: " + user.getId());
    }

    @Test
    public void testGetUserById() {
        System.out.println("=== Test: Get User By ID ===");
        System.out.println("Email being used: " + registerRequest.getEmail());

        // First register
        UserResponse registered = userService.registerUser(registerRequest);
        System.out.println("Registered user with ID: " + registered.getId());

        // Then retrieve
        UserResponse found = userService.getUserById(registered.getId());

        assertEquals(registered.getId(), found.getId());
        assertEquals(registered.getEmail(), found.getEmail());

        System.out.println("✅ User found with ID: " + found.getId());
    }

    @Test
    public void testGetUserByEmail() {
        System.out.println("=== Test: Get User By Email ===");
        System.out.println("Email being used: " + registerRequest.getEmail());

        // First register
        UserResponse registered = userService.registerUser(registerRequest);
        System.out.println("Registered user with email: " + registered.getEmail());

        // Then retrieve by email
        UserResponse found = userService.getUserByEmail(registered.getEmail());

        assertEquals(registered.getEmail(), found.getEmail());

        System.out.println("✅ User found with email: " + found.getEmail());
    }

    @Test
    public void testLoginUser() {
        System.out.println("=== Test: Login User ===");
        System.out.println("Email being used: " + registerRequest.getEmail());

        // First register
        userService.registerUser(registerRequest);
        System.out.println("User registered successfully");

        // Then login - now returns AuthResponse
        AuthResponse authResponse = userService.loginUser(loginRequest);

        assertNotNull(authResponse);
        assertNotNull(authResponse.getToken());  // Check that token is generated
        assertEquals(registerRequest.getEmail(), authResponse.getUser().getEmail());

        System.out.println("✅ User logged in: " + authResponse.getUser().getEmail());
        System.out.println("✅ JWT Token generated (first 50 chars): " + authResponse.getToken().substring(0, 50) + "...");
    }

    @Test
    public void testUpdateUser() {
        System.out.println("=== Test: Update User ===");
        System.out.println("Email being used: " + registerRequest.getEmail());

        // First register
        UserResponse registered = userService.registerUser(registerRequest);
        System.out.println("Registered user with ID: " + registered.getId());

        // Create update request
        UpdateUser updateRequest = new UpdateUser();
        updateRequest.setName("Updated Name");
        updateRequest.setPhone("9876543210");

        // Update user
        UserResponse updated = userService.updateUser(registered.getId(), updateRequest);

        assertEquals("Updated Name", updated.getName());
        assertEquals("9876543210", updated.getPhone());

        System.out.println("✅ User updated successfully to: " + updated.getName());
    }

    @Test
    public void testDeleteUser() {
        System.out.println("=== Test: Delete User ===");
        System.out.println("Email being used: " + registerRequest.getEmail());

        // First register
        UserResponse registered = userService.registerUser(registerRequest);
        Long userId = registered.getId();
        System.out.println("Registered user with ID: " + userId);

        // Delete user
        userService.deleteUser(userId);
        System.out.println("User deleted");

        // Try to find deleted user - should throw exception
        assertThrows(Exception.class, () -> {
            userService.getUserById(userId);
        });

        System.out.println("✅ User deleted successfully (exception thrown as expected)");
    }
}