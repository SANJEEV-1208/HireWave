package com.example.demo.services;

import com.example.demo.dto.JobResponse;
import com.example.demo.models.Job;
import com.example.demo.models.User;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class JobRecommendationService {

    @Value("${gemini.api-key}")
    private String apiKey;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";

    private static final String SYSTEM_PROMPT =
        "You are a job matching expert. Given a candidate's profile and a list of available jobs, " +
        "return the IDs of the top 5 most relevant jobs ranked by match quality. " +
        "Consider skills, experience level, and job type in your analysis. " +
        "Respond with ONLY a JSON array of numbers (job IDs), nothing else. Example: [12, 45, 3, 67, 8]";

    public List<JobResponse> getRecommendations(Long userId) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return Collections.emptyList();

            List<Job> activeJobs = jobRepository.findByActiveTrue();
            if (activeJobs.isEmpty()) return Collections.emptyList();

            String profileContext =
                "Skills: " + (user.getSkills() != null ? user.getSkills() : "not specified") + "\n" +
                "Experience: " + (user.getExperience() != null ? user.getExperience() : "not specified") + "\n" +
                "Education: " + (user.getEducation() != null ? user.getEducation() : "not specified");

            List<Job> jobsToConsider = activeJobs.size() > 40 ? activeJobs.subList(0, 40) : activeJobs;

            StringBuilder jobsContext = new StringBuilder();
            for (Job job : jobsToConsider) {
                jobsContext.append("ID:").append(job.getId())
                    .append(" | ").append(job.getTitle())
                    .append(" | ").append(job.getCompany())
                    .append(" | Exp: ").append(job.getExperience() != null ? job.getExperience() : "any")
                    .append(" | ").append(job.getWorkType() != null ? job.getWorkType() : "")
                    .append(" ").append(job.getWorkMode() != null ? job.getWorkMode() : "")
                    .append("\n");
            }

            String userMessage = "CANDIDATE PROFILE:\n" + profileContext +
                "\n\nAVAILABLE JOBS:\n" + jobsContext;

            String aiResponse = callGroq(SYSTEM_PROMPT, userMessage);
            List<Long> recommendedIds = parseIds(aiResponse);

            Map<Long, Job> jobMap = jobsToConsider.stream()
                .collect(Collectors.toMap(Job::getId, j -> j));

            return recommendedIds.stream()
                .map(jobMap::get)
                .filter(Objects::nonNull)
                .map(JobResponse::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("AI recommendation error", e);
            return Collections.emptyList();
        }
    }

    private String callGroq(String systemPrompt, String userMessage) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", MODEL);
        body.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userMessage)
        ));
        body.put("temperature", 0.2);
        body.put("max_tokens", 80);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
        ResponseEntity<String> response = restTemplate.postForEntity(GROQ_URL, entity, String.class);

        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("choices").get(0).path("message").path("content").asText();
    }

    private List<Long> parseIds(String text) {
        try {
            int start = text.indexOf('[');
            int end = text.lastIndexOf(']');
            if (start == -1 || end == -1) return Collections.emptyList();
            Long[] ids = objectMapper.readValue(text.substring(start, end + 1), Long[].class);
            return Arrays.asList(ids);
        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", text);
            return Collections.emptyList();
        }
    }
}
