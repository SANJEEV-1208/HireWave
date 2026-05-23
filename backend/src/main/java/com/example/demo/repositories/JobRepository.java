package com.example.demo.repositories;

import com.example.demo.models.Job;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findByActiveTrue();

    List<Job> findByEmployer(User employer);

    List<Job> findByEmployerAndActiveTrue(User employer);

    List<Job> findByTitleContainingIgnoreCase(String keyword);

    @Modifying
    @Transactional
    @Query("UPDATE Job j SET j.viewCount = j.viewCount + 1 WHERE j.id = :id")
    void incrementViewCount(@Param("id") Long id);

    @Query("SELECT j FROM Job j WHERE j.active = true " +
           "AND (:title = '' OR LOWER(j.title) LIKE LOWER(CONCAT('%', :title, '%'))) " +
           "AND (:location = '' OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) " +
           "AND (:workMode = '' OR LOWER(j.workMode) LIKE LOWER(CONCAT('%', :workMode, '%'))) " +
           "AND (:workType = '' OR LOWER(j.workType) LIKE LOWER(CONCAT('%', :workType, '%'))) " +
           "AND (:experience = '' OR LOWER(j.experience) LIKE LOWER(CONCAT('%', :experience, '%')))")
    List<Job> searchJobsFiltered(
        @Param("title") String title,
        @Param("location") String location,
        @Param("workMode") String workMode,
        @Param("workType") String workType,
        @Param("experience") String experience
    );
}