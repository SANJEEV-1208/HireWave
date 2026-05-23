package com.example.demo.services;

import com.example.demo.models.Job;
import com.example.demo.models.User;
import com.example.demo.repositories.JobRepository;
import com.example.demo.repositories.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    @Value("${gemini.api-key}")
    private String geminiApiKey;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String GROQ_URL =
        "https://api.groq.com/openai/v1/chat/completions";

    private static final String COVER_LETTER_PROMPT =
        "You are an expert career counselor. Write a professional, personalized cover letter based on the applicant profile and job details provided. " +
        "The letter should be 3-4 paragraphs: opening (why this role and company), middle (highlight relevant skills and experience), closing (enthusiasm + call to action). " +
        "Keep it under 350 words. Sound natural and specific, not generic. " +
        "Respond with ONLY the cover letter text — no subject line, no 'Dear Hiring Manager' greeting, no extra explanation.";

    private static final String SYSTEM_PROMPT =
        "You are JobBot, an assistant for a job portal. Always respond with a single JSON object — no markdown, no extra text.\n\n" +
        "If the user wants to find/search/show/list jobs, respond with:\n" +
        "{\"type\":\"job_search\",\"title\":\"<job role or empty string>\",\"location\":\"<city or empty string>\"," +
        "\"workMode\":\"<remote|onsite|hybrid or empty string>\",\"workType\":\"<full-time|part-time|contract|internship or empty string>\"," +
        "\"experience\":\"<Fresher|1-3 years|3-5 years|5-10 years|10+ years or empty string>\"}\n\n" +
        "For all other questions (salary, skills, career advice, interview tips, resume help), respond with:\n" +
        "{\"type\":\"career_answer\",\"answer\":\"<helpful answer in 2-4 sentences>\"}\n\n" +
        "Respond ONLY with the JSON. No other text.";

    public String chat(String userMessage) {
        try {
            String geminiText = callGroq(SYSTEM_PROMPT, userMessage);
            log.info("Gemini raw response: {}", geminiText);
            JsonNode intent = objectMapper.readTree(extractJson(geminiText));
            String type = intent.path("type").asText("");

            if ("job_search".equals(type)) {
                String title    = intent.path("title").asText("").trim();
                String location = intent.path("location").asText("").trim();
                String workMode = intent.path("workMode").asText("").trim();
                String workType = intent.path("workType").asText("").trim();
                String experience = intent.path("experience").asText("").trim();

                List<Job> jobs = jobRepository.searchJobsFiltered(title, location, workMode, workType, experience);
                LocalDate today = LocalDate.now();
                jobs = jobs.stream()
                    .filter(j -> j.getDeadline() == null || !j.getDeadline().isBefore(today))
                    .collect(Collectors.toList());

                return formatJobResults(jobs, title, location);
            } else {
                return intent.path("answer").asText("I couldn't understand your question. Please try again.");
            }
        } catch (Exception e) {
            log.error("Chat error", e);
            return "Sorry, I ran into an error. Please try again!";
        }
    }

    private String callGroq(String systemPrompt, String userMessage) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", "llama-3.1-8b-instant");
        body.put("temperature", 0.1);

        ArrayNode messages = objectMapper.createArrayNode();
        messages.add(objectMapper.createObjectNode()
            .put("role", "system").put("content", systemPrompt));
        messages.add(objectMapper.createObjectNode()
            .put("role", "user").put("content", userMessage));
        body.set("messages", messages);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(geminiApiKey);
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

        ResponseEntity<String> response = restTemplate.postForEntity(GROQ_URL, entity, String.class);

        log.info("Groq HTTP status: {}", response.getStatusCode());
        JsonNode responseJson = objectMapper.readTree(response.getBody());
        return responseJson.path("choices").get(0)
            .path("message").path("content").asText();
    }

    public String generateCoverLetter(Long userId, Long jobId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found"));

            String userContext = "Applicant Name: " + user.getName() + "\n"
                + "Skills: " + (user.getSkills() != null ? user.getSkills() : "not specified") + "\n"
                + "Experience: " + (user.getExperience() != null ? user.getExperience() : "not specified") + "\n"
                + "Education: " + (user.getEducation() != null ? user.getEducation() : "not specified");

            String jobContext = "Job Title: " + job.getTitle() + "\n"
                + "Company: " + job.getCompany() + "\n"
                + "Location: " + (job.getLocation() != null ? job.getLocation() : "") + "\n"
                + "Required Experience: " + (job.getExperience() != null ? job.getExperience() : "") + "\n"
                + "Job Description: " + job.getDescription();

            return callGroq(COVER_LETTER_PROMPT, userContext + "\n\n" + jobContext);
        } catch (Exception e) {
            log.error("Cover letter generation error", e);
            return "Failed to generate cover letter. Please try again.";
        }
    }

    private String extractJson(String text) {
        if (text == null) return "{}";
        String s = text.trim();
        if (s.startsWith("```")) {
            s = s.replaceAll("(?s)^```[a-z]*\\n?", "").replaceAll("```\\s*$", "").trim();
        }
        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start) return s.substring(start, end + 1);
        return s;
    }

    private String formatJobResults(List<Job> jobs, String title, String location) {
        if (jobs.isEmpty()) {
            StringBuilder msg = new StringBuilder("No jobs found");
            if (!title.isEmpty()) msg.append(" for \"").append(title).append("\"");
            if (!location.isEmpty()) msg.append(" in ").append(location);
            msg.append(". Try different keywords or browse the Jobs page for all listings.");
            return msg.toString();
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Found ").append(jobs.size()).append(" job").append(jobs.size() > 1 ? "s" : "");
        if (!title.isEmpty()) sb.append(" for \"").append(title).append("\"");
        if (!location.isEmpty()) sb.append(" in ").append(location);
        sb.append(":\n\n");

        int limit = Math.min(jobs.size(), 5);
        for (int i = 0; i < limit; i++) {
            Job j = jobs.get(i);
            sb.append(i + 1).append(". ").append(j.getTitle()).append(" at ").append(j.getCompany());
            if (j.getLocation() != null && !j.getLocation().isEmpty())
                sb.append(" — ").append(j.getLocation());
            if (j.getWorkMode() != null && !j.getWorkMode().isEmpty())
                sb.append(" (").append(j.getWorkMode()).append(")");
            if (j.getSalaryRange() != null && !j.getSalaryRange().isEmpty())
                sb.append(" | ").append(j.getSalaryRange());
            sb.append("\n");
        }

        if (jobs.size() > 5)
            sb.append("\n...and ").append(jobs.size() - 5).append(" more. Visit the Jobs page to see all!");

        return sb.toString();
    }
}
