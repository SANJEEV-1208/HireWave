package com.example.demo.repositories;

import com.example.demo.models.JobView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobViewRepository extends JpaRepository<JobView, Long> {
    boolean existsByJobIdAndViewerId(Long jobId, Long viewerId);
}
