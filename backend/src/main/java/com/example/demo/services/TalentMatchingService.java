package com.example.demo.services;

import com.example.demo.dto.UserResponse;
import com.example.demo.models.Job;
import com.example.demo.models.User;
import com.example.demo.models.UserRole;
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
public class TalentMatchingService {

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
        "You are a talent matching expert. The candidates below have already been pre-filtered to have at least one matching skill. " +
        "Rank them by how many required skills they match and how well their overall profile fits the role. " +
        "Return up to 5 candidate IDs in descending order of fit. " +
        "Respond with ONLY a JSON array of numbers (candidate IDs), nothing else. Example: [12, 45, 3]";

    public List<UserResponse> getMatches(Long jobId) {
        try {
            Job job = jobRepository.findById(jobId).orElse(null);
            if (job == null) return Collections.emptyList();

            // Parse required skills for pre-filtering
            List<String> requiredSkillList = Collections.emptyList();
            if (job.getRequiredSkills() != null && !job.getRequiredSkills().isBlank()) {
                try {
                    String[] arr = objectMapper.readValue(job.getRequiredSkills(), String[].class);
                    requiredSkillList = Arrays.asList(arr);
                } catch (Exception e) {
                    log.warn("Could not parse requiredSkills: {}", job.getRequiredSkills());
                }
            }
            final List<String> finalRequired = requiredSkillList;

            List<User> allSeekers = userRepository.findByRole(UserRole.JOB_SEEKER).stream()
                .filter(u -> u.getSkills() != null && !u.getSkills().isBlank())
                .filter(u -> {
                    if (finalRequired.isEmpty()) return true;
                    try {
                        String[] seekerSkills = objectMapper.readValue(u.getSkills(), String[].class);
                        return Arrays.stream(seekerSkills).anyMatch(skill ->
                            finalRequired.stream().anyMatch(req -> req.equalsIgnoreCase(skill)));
                    } catch (Exception e) {
                        return false;
                    }
                })
                .limit(30)
                .collect(Collectors.toList());

            if (allSeekers.isEmpty()) return Collections.emptyList();

            String jobContext =
                "Title: " + job.getTitle() + "\n" +
                "Required Skills: " + (job.getRequiredSkills() != null ? job.getRequiredSkills() : "not specified") + "\n" +
                "Required Experience: " + (job.getExperience() != null ? job.getExperience() : "any") + "\n" +
                "Work Type: " + (job.getWorkType() != null ? job.getWorkType() : "") + "\n" +
                "Work Mode: " + (job.getWorkMode() != null ? job.getWorkMode() : "");

            StringBuilder candidatesContext = new StringBuilder();
            for (User seeker : allSeekers) {
                candidatesContext.append("ID:").append(seeker.getId())
                    .append(" | ").append(seeker.getName())
                    .append(" | Skills: ").append(seeker.getSkills() != null ? seeker.getSkills() : "none")
                    .append(" | Exp: ").append(seeker.getExperience() != null ? seeker.getExperience().substring(0, Math.min(seeker.getExperience().length(), 100)) : "none")
                    .append("\n");
            }

            String userMessage = "JOB REQUIREMENTS:\n" + jobContext +
                "\n\nCANDIDATES:\n" + candidatesContext;

            String aiResponse = callGroq(SYSTEM_PROMPT, userMessage);
            List<Long> matchedIds = parseIds(aiResponse);

            Map<Long, User> seekerMap = allSeekers.stream()
                .collect(Collectors.toMap(User::getId, u -> u));

            return matchedIds.stream()
                .map(seekerMap::get)
                .filter(Objects::nonNull)
                .map(UserResponse::new)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("AI talent matching error", e);
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
