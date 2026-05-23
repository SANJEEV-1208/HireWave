package com.example.demo.services;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class ResumeParserService {

    private static final List<String> SKILLS_DICT = Arrays.asList(
        // Languages
        "Java", "Python", "JavaScript", "TypeScript", "Kotlin", "Swift", "Go",
        "Rust", "Ruby", "PHP", "Scala", "R", "MATLAB", "C", "C++", "C#", "Dart",
        "Groovy", "Perl",
        // Web frameworks & libraries
        "React", "Angular", "Vue", "Svelte", "Next.js", "Node.js", "Nuxt.js",
        "Express", "Django", "Flask", "FastAPI", "Spring Boot", "Spring MVC",
        "Laravel", "ASP.NET", "Nest.js", "Spring",
        // Databases
        "MySQL", "PostgreSQL", "MongoDB", "Redis", "Oracle", "SQLite", "Cassandra",
        "DynamoDB", "Elasticsearch", "Firebase", "SQL Server", "MariaDB", "Neo4j",
        // Cloud & DevOps
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Terraform",
        "Ansible", "Nginx", "Apache", "Linux", "CI/CD", "Git", "GitHub", "GitLab",
        // Mobile
        "Android", "iOS", "Flutter", "React Native", "Xamarin",
        // Data, ML & Analytics
        "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy", "Spark",
        "Hadoop", "Tableau", "Power BI", "Machine Learning", "Deep Learning",
        "Data Science", "NLP",
        // Build & testing tools
        "Maven", "Gradle", "JUnit", "Selenium", "Jest", "Cypress",
        // Frontend
        "HTML", "CSS", "Bootstrap", "Tailwind", "jQuery", "Webpack",
        // Architecture & practices
        "REST", "GraphQL", "Microservices", "Hibernate", "JPA",
        "DevOps", "Agile", "Scrum"
    );

    // Pre-compile patterns for each skill
    private static final List<SkillPattern> COMPILED_SKILLS = buildPatterns();

    private static List<SkillPattern> buildPatterns() {
        List<SkillPattern> list = new ArrayList<>();
        for (String skill : SKILLS_DICT) {
            // Purely alphanumeric: use word boundaries
            // Has spaces, dots, slashes, +, # etc: use non-word-char boundaries
            boolean pureAlpha = skill.matches("[A-Za-z0-9]+");
            String regex = pureAlpha
                ? "(?i)\\b" + Pattern.quote(skill) + "\\b"
                : "(?i)(?<![A-Za-z0-9])" + Pattern.quote(skill) + "(?![A-Za-z0-9])";
            list.add(new SkillPattern(skill, Pattern.compile(regex)));
        }
        return list;
    }

    private record SkillPattern(String skill, Pattern pattern) {}

    public List<String> parseFromBytes(byte[] data) {
        String text;
        try (PDDocument doc = Loader.loadPDF(data)) {
            text = new PDFTextStripper().getText(doc);
        } catch (Exception e) {
            return Collections.emptyList();
        }

        List<String> found = new ArrayList<>();
        for (SkillPattern sp : COMPILED_SKILLS) {
            if (sp.pattern().matcher(text).find()) {
                found.add(sp.skill());
            }
        }
        return found;
    }
}
