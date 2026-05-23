package com.example.demo.repositories;

import com.example.demo.models.ProfileView;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;

public interface ProfileViewRepository extends JpaRepository<ProfileView, Long> {
    boolean existsByViewerIdAndSeekerIdAndViewedAtAfter(Long viewerId, Long seekerId, LocalDateTime since);
}
