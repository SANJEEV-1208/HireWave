package com.example.demo.services;

import com.example.demo.dto.ChatMessageRequest;
import com.example.demo.dto.ChatMessageResponse;
import com.example.demo.models.ChatMessage;
import com.example.demo.models.User;
import com.example.demo.repositories.ChatMessageRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatMessageService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private FileStorageService fileStorageService;

    public ChatMessageResponse sendMessage(Long senderId, ChatMessageRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        ChatMessage msg = new ChatMessage();
        msg.setSender(sender);
        msg.setRecipient(recipient);
        msg.setContent(request.getContent());
        msg.setApplicationId(request.getApplicationId());

        ChatMessage saved = chatMessageRepository.save(msg);
        ChatMessageResponse response = new ChatMessageResponse(saved);

        // Push to recipient's WebSocket queue
        messagingTemplate.convertAndSendToUser(
                recipient.getId().toString(),
                "/queue/messages",
                response
        );

        return response;
    }

    public ChatMessageResponse sendMessageWithFile(Long senderId, Long recipientId, String content, MultipartFile file) {
        try {
            User sender = userRepository.findById(senderId).orElseThrow(() -> new RuntimeException("Sender not found"));
            User recipient = userRepository.findById(recipientId).orElseThrow(() -> new RuntimeException("Recipient not found"));

            ChatMessage msg = new ChatMessage();
            msg.setSender(sender);
            msg.setRecipient(recipient);
            msg.setContent(content != null ? content : "");

            if (file != null && !file.isEmpty()) {
                String storedName = fileStorageService.storeFile(file, "msg_" + senderId);
                msg.setAttachmentPath(storedName);
                msg.setAttachmentName(file.getOriginalFilename());
            }

            ChatMessage saved = chatMessageRepository.save(msg);
            ChatMessageResponse response = new ChatMessageResponse(saved);
            messagingTemplate.convertAndSendToUser(recipient.getId().toString(), "/queue/messages", response);
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Failed to send message with file", e);
        }
    }

    public List<ChatMessageResponse> getConversation(Long userA, Long userB) {
        return chatMessageRepository.findConversation(userA, userB)
                .stream().map(ChatMessageResponse::new).collect(Collectors.toList());
    }

    public List<ChatMessageResponse> getConversations(Long userId) {
        return chatMessageRepository.findLatestPerConversation(userId)
                .stream().map(ChatMessageResponse::new).collect(Collectors.toList());
    }

    public void markRead(Long currentUserId, Long otherUserId) {
        chatMessageRepository.markAsRead(otherUserId, currentUserId);
        // Notify the original sender that their messages were read
        messagingTemplate.convertAndSendToUser(
            otherUserId.toString(), "/queue/read-receipts",
            java.util.Map.of("readBy", currentUserId)
        );
    }

    public long getUnreadCount(Long userId) {
        return chatMessageRepository.countByRecipientIdAndIsReadFalse(userId);
    }
}
