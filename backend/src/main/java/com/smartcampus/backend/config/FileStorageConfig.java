package com.smartcampus.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Slf4j
@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @Value("${app.upload.ticket-attachments-dir:uploads/tickets}")
    private String ticketAttachmentsDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadLocation = Paths.get(ticketAttachmentsDir).toAbsolutePath().normalize().toUri().toString();
        if (!uploadLocation.endsWith("/")) {
            uploadLocation += "/";
        }
        registry.addResourceHandler("/files/tickets/**")
                .addResourceLocations(uploadLocation);
        log.info("Mapped /files/tickets/** to static location: {}", uploadLocation);
    }

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
