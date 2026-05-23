package com.example.demo.repositories;

import com.example.demo.models.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m WHERE " +
           "(m.sender.id = :a AND m.recipient.id = :b) OR " +
           "(m.sender.id = :b AND m.recipient.id = :a) " +
           "ORDER BY m.sentAt ASC")
    List<ChatMessage> findConversation(@Param("a") Long a, @Param("b") Long b);

    @Query("SELECT m FROM ChatMessage m WHERE m.id IN (" +
           "SELECT MAX(m2.id) FROM ChatMessage m2 WHERE " +
           "m2.sender.id = :uid OR m2.recipient.id = :uid " +
           "GROUP BY CASE WHEN m2.sender.id = :uid THEN m2.recipient.id ELSE m2.sender.id END" +
           ") ORDER BY m.sentAt DESC")
    List<ChatMessage> findLatestPerConversation(@Param("uid") Long uid);

    long countByRecipientIdAndIsReadFalse(Long recipientId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.sender.id = :senderId AND m.recipient.id = :recipientId AND m.isRead = false")
    void markAsRead(@Param("senderId") Long senderId, @Param("recipientId") Long recipientId);
}
