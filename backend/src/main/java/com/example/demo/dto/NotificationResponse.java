package com.example.demo.dto;

import com.example.demo.models.Notification;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.format.DateTimeFormatter;

public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private boolean isRead;
    private String createdAt;
    private Long relatedApplicationId;

    public NotificationResponse(Notification n) {
        this.id = n.getId();
        this.title = n.getTitle();
        this.message = n.getMessage();
        this.isRead = n.isRead();
        this.createdAt = n.getCreatedAt() != null
                ? n.getCreatedAt().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm"))
                : "";
        this.relatedApplicationId = n.getRelatedApplicationId();
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    @JsonProperty("isRead")
    public boolean isRead() { return isRead; }
    public String getCreatedAt() { return createdAt; }
    public Long getRelatedApplicationId() { return relatedApplicationId; }
}
