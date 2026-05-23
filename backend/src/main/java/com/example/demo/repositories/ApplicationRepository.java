package com.example.demo.repositories;

import com.example.demo.models.Application;
import com.example.demo.models.Job;
import com.example.demo.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobSeeker(User jobSeeker);
    List<Application> findByJob(Job job);
    boolean existsByJobAndJobSeeker(Job job, User jobSeeker);
    Optional<Application> findByJobAndJobSeeker(Job job, User jobSeeker);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.employer.id = :eid")
    long countByEmployerId(@Param("eid") Long eid);

    @Query("SELECT a.status, COUNT(a) FROM Application a WHERE a.job.employer.id = :eid GROUP BY a.status")
    List<Object[]> statusDistributionForEmployer(@Param("eid") Long eid);

    @Query("SELECT a.job.id, a.job.title, COUNT(a), a.job.viewCount FROM Application a " +
           "WHERE a.job.employer.id = :eid GROUP BY a.job.id, a.job.title, a.job.viewCount " +
           "ORDER BY COUNT(a) DESC")
    List<Object[]> topJobsByApplicationsForEmployer(@Param("eid") Long eid);

    @Query(value = "SELECT CAST(applied_at AS DATE) AS day, COUNT(*) AS cnt " +
                   "FROM applications WHERE job_id IN (SELECT id FROM jobs WHERE employer_id = :eid) " +
                   "AND applied_at >= :from " +
                   "GROUP BY CAST(applied_at AS DATE) ORDER BY CAST(applied_at AS DATE)",
           nativeQuery = true)
    List<Object[]> countApplicationsByDayForEmployer(@Param("eid") Long eid, @Param("from") LocalDateTime from);
}
