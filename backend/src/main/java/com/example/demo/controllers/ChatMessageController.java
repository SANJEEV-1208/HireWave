package com.example.demo.controllers;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.ChatMessageRequest;
import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.models.ChatMessage;
import com.example.demo.repositories.ChatMessageRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.services.ChatMessageService;
import com.example.demo.services.FileStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URLConnection;
import java.security.Principal;
import java.util.List;

@Controller
@RequestMapping("/api/messages")
public class ChatMessageController {

    @Autowired
    private ChatMessageService chatMessageService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private Long getUserId(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            return jwtUtil.extractUserId(auth.substring(7));
        }
        return null;
    }

    // REST: send message (also pushes via WebSocket)
    @PostMapping("/send")
    @ResponseBody
    public ResponseEntity<ApiResponse<ChatMessageResponse>> send(
            @RequestBody ChatMessageRequest req, HttpServletRequest request) {
        Long senderId = getUserId(request);
        ChatMessageResponse response = chatMessageService.sendMessage(senderId, req);
        return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", response));
    }

    // REST: send message with optional file attachment
    @PostMapping(value = "/send-with-file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseBody
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendWithFile(
            @RequestParam Long recipientId,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file,
            HttpServletRequest request) {
        Long senderId = getUserId(request);
        ChatMessageResponse response = chatMessageService.sendMessageWithFile(senderId, recipientId, content, file);
        return ResponseEntity.ok(new ApiResponse<>(true, "Message sent", response));
    }

    // REST: download attachment from a message
    @GetMapping("/{messageId}/attachment")
    @ResponseBody
    public ResponseEntity<Resource> getAttachment(@PathVariable Long messageId) {
        try {
            ChatMessage msg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
            if (msg.getAttachmentPath() == null) return ResponseEntity.notFound().build();
            Resource resource = fileStorageService.loadAsResource(msg.getAttachmentPath());
            String contentType = URLConnection.guessContentTypeFromName(msg.getAttachmentName() != null ? msg.getAttachmentName() : msg.getAttachmentPath());
            if (contentType == null) contentType = "application/octet-stream";
            return ResponseEntity.ok().contentType(MediaType.parseMediaType(contentType)).body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // REST: get inbox (latest message per conversation partner)
    @GetMapping("/conversations")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getConversations(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Conversations", chatMessageService.getConversations(userId)));
    }

    // REST: get full thread with a specific user
    @GetMapping("/conversation/{otherUserId}")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getConversation(
            @PathVariable Long otherUserId, HttpServletRequest request) {
        Long userId = getUserId(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Messages", chatMessageService.getConversation(userId, otherUserId)));
    }

    // REST: mark all messages from otherUser as read
    @PutMapping("/read/{otherUserId}")
    @ResponseBody
    public ResponseEntity<ApiResponse<Void>> markRead(
            @PathVariable Long otherUserId, HttpServletRequest request) {
        Long userId = getUserId(request);
        chatMessageService.markRead(userId, otherUserId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Marked as read", null));
    }

    // REST: unread count for badge
    @GetMapping("/unread-count")
    @ResponseBody
    public ResponseEntity<ApiResponse<Long>> unreadCount(HttpServletRequest request) {
        Long userId = getUserId(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Count", chatMessageService.getUnreadCount(userId)));
    }

    // WebSocket: receive message from client via /app/chat
    @MessageMapping("/chat")
    public void handleWebSocketMessage(@Payload ChatMessageRequest req, Principal principal) {
        Long senderId = Long.parseLong(principal.getName());
        chatMessageService.sendMessage(senderId, req);
    }
}
