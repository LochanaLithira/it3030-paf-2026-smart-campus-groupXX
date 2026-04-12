package com.smartcampus.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Configuration
public class FileStorageConfig {

    @Value("${app.upload.ticket-attachments-dir:uploads/tickets}")
    private String ticketAttachmentsDir;

    @Bean
    public Path ticketUploadDirectory() throws IOException {
        Path uploadPath = Paths.get(ticketAttachmentsDir).toAbsolutePath().normalize();
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created ticket attachments directory: {}", uploadPath);
        } else {
            log.info("Ticket attachments directory exists: {}", uploadPath);
        }
        
        return uploadPath;
    }
}
