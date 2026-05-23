package com.example.demo.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> getAuthInfo() {
        Map<String, Object> info = new HashMap<>();

        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null) {
            info.put("authenticated", authentication.isAuthenticated());
            info.put("name", authentication.getName());
            info.put("authorities", authentication.getAuthorities().toString());
            info.put("principal", authentication.getPrincipal());
        } else {
            info.put("authenticated", false);
            info.put("message", "No authentication found");
        }

        return ResponseEntity.ok(info);
    }
}