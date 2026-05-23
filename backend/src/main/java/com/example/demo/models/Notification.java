package com.example.demo.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Setter @Getter
    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Setter @Getter
    private String title;

    @Setter @Getter
    @Column(columnDefinition = "TEXT")
    private String message;

    @Setter @Getter
    private boolean isRead = false;

    @Setter @Getter
    private LocalDateTime createdAt;

    @Setter @Getter
    private Long relatedApplicationId;

    public Notification() {}

    public Notification(User recipient, String title, String message, Long relatedApplicationId) {
        this.recipient = recipient;
        this.title = title;
        this.message = message;
        this.relatedApplicationId = relatedApplicationId;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public Long getId() { return id; }
}
