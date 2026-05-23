package com.example.demo.services;

import com.example.demo.models.ProfileView;
import com.example.demo.models.User;
import com.example.demo.repositories.ProfileViewRepository;
import com.example.demo.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class ProfileViewService {

    @Autowired
    private ProfileViewRepository profileViewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    public void recordView(Long viewerId, Long seekerId) {
        if (viewerId.equals(seekerId)) return;

        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        if (profileViewRepository.existsByViewerIdAndSeekerIdAndViewedAtAfter(viewerId, seekerId, cutoff)) return;

        ProfileView view = new ProfileView();
        view.setViewerId(viewerId);
        view.setSeekerId(seekerId);
        view.setViewedAt(LocalDateTime.now());
        profileViewRepository.save(view);

        userRepository.findById(viewerId).ifPresent(viewer ->
            userRepository.findById(seekerId).ifPresent(seeker ->
                notificationService.createNotification(seeker, "Profile Viewed",
                    viewer.getName() + " viewed your profile", null)
            )
        );
    }
}
