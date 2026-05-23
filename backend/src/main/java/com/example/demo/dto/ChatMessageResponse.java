package com.example.demo.dto;

import com.example.demo.models.ChatMessage;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.format.DateTimeFormatter;

public class ChatMessageResponse {
    private Long id;
    private Long senderId;
    private String senderName;
    private Long recipientId;
    private String recipientName;
    private String content;
    private String attachmentPath;
    private String attachmentName;
    private String sentAt;
    private boolean isRead;
    private Long applicationId;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public ChatMessageResponse(ChatMessage m) {
        this.id = m.getId();
        this.senderId = m.getSender().getId();
        this.senderName = m.getSender().getName();
        this.recipientId = m.getRecipient().getId();
        this.recipientName = m.getRecipient().getName();
        this.content = m.getContent();
        this.attachmentPath = m.getAttachmentPath();
        this.attachmentName = m.getAttachmentName();
        this.sentAt = m.getSentAt() != null ? m.getSentAt().format(FMT) : null;
        this.isRead = m.isRead();
        this.applicationId = m.getApplicationId();
    }

    public Long getId() { return id; }
    public Long getSenderId() { return senderId; }
    public String getSenderName() { return senderName; }
    public Long getRecipientId() { return recipientId; }
    public String getRecipientName() { return recipientName; }
    public String getContent() { return content; }
    public String getAttachmentPath() { return attachmentPath; }
    public String getAttachmentName() { return attachmentName; }
    public String getSentAt() { return sentAt; }
    @JsonProperty("isRead")
    public boolean isRead() { return isRead; }
    public Long getApplicationId() { return applicationId; }
}
