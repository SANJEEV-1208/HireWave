package com.example.demo;

import com.example.demo.models.User;
import com.example.demo.models.UserRole;
import com.example.demo.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import java.time.LocalDateTime;

@SpringBootTest
public class RepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testSaveUser() {
        // Create a new user
        User user = new User();
        user.setEmail("test@example.com");
        user.setName("Test User");
        user.setPassword("password123");
        user.setRole(UserRole.JOB_SEEKER);
        user.setCreatedAt(LocalDateTime.now());

        // Save to database
        User savedUser = userRepository.save(user);
        System.out.println("✅ User saved with ID: " + savedUser.getId());

        // Verify we can find it
        User foundUser = userRepository.findById(savedUser.getId()).get();
        System.out.println("✅ User found: " + foundUser.getName());

        // Verify email search works
        User emailUser = userRepository.findByEmail("test@example.com").get();
        System.out.println("✅ User found by email: " + emailUser.getEmail());
    }
}