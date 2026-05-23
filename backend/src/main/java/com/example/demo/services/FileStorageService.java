package com.example.demo.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URLConnection;
import java.nio.file.*;
import java.util.Set;

@Service
public class FileStorageService {

    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024; // 10 MB

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".doc", ".docx"
    );

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "application/pdf",
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    private final Path storageLocation;

    public FileStorageService(@Value("${file.upload-dir}") String uploadDir) throws IOException {
        this.storageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.storageLocation);
    }

    public String storeFile(MultipartFile file, String prefix) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds the 10 MB limit");
        }

        String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String ext = original.contains(".")
                ? original.substring(original.lastIndexOf('.')).toLowerCase()
                : "";
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new IllegalArgumentException("File type not allowed: " + ext);
        }

        // Sniff actual MIME type from magic bytes (server-side, not client-provided)
        try (InputStream raw = file.getInputStream();
             BufferedInputStream bis = new BufferedInputStream(raw)) {
            String sniffed = URLConnection.guessContentTypeFromStream(bis);
            if (sniffed != null && !ALLOWED_MIME_TYPES.contains(sniffed)) {
                throw new IllegalArgumentException("File content does not match an allowed type");
            }
        }

        String filename = prefix + "_" + System.currentTimeMillis() + ext;
        Path target = storageLocation.resolve(filename);
        // Re-open stream for copying (original stream was consumed by sniffing)
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }

    public Resource loadAsResource(String filename) throws MalformedURLException {
        Path filePath = storageLocation.resolve(filename).normalize();
        Resource resource = new UrlResource(filePath.toUri());
        if (resource.exists() && resource.isReadable()) return resource;
        throw new RuntimeException("File not found: " + filename);
    }

    public void deleteFile(String filename) {
        try {
            Files.deleteIfExists(storageLocation.resolve(filename).normalize());
        } catch (IOException ignored) {}
    }
}
