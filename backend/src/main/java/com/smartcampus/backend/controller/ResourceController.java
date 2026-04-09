package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.common.PageResponse;
import com.smartcampus.backend.dto.resource.*;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import com.smartcampus.backend.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Resources", description = "Facilities and assets resource management")
@RestController
@RequestMapping("/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @Operation(summary = "List resources with filters")
    @GetMapping
    @PreAuthorize("hasAuthority('resources.read')")
    public ResponseEntity<PageResponse<ResourceResponse>> listResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer minCapacity,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        return ResponseEntity.ok(PageResponse.from(resourceService.listResources(
                type, status, locationId, tags, search, minCapacity, pageable
        )));
    }

    @Operation(summary = "Get resource by ID")
    @GetMapping("/{resourceId}")
    @PreAuthorize("hasAuthority('resources.read')")
    public ResponseEntity<ResourceResponse> getResourceById(@PathVariable UUID resourceId) {
        return ResponseEntity.ok(resourceService.getResourceById(resourceId));
    }

    @Operation(summary = "Create resource (admin)")
    @PostMapping
    @PreAuthorize("hasAuthority('resources.create')")
    public ResponseEntity<ResourceResponse> createResource(@Valid @RequestBody ResourceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(request));
    }

    @Operation(summary = "Update resource (admin)")
    @PutMapping("/{resourceId}")
    @PreAuthorize("hasAuthority('resources.update')")
    public ResponseEntity<ResourceResponse> updateResource(
            @PathVariable UUID resourceId,
            @Valid @RequestBody ResourceRequest request
    ) {
        return ResponseEntity.ok(resourceService.updateResource(resourceId, request));
    }

    @Operation(summary = "Patch resource status (admin)")
    @PatchMapping("/{resourceId}/status")
    @PreAuthorize("hasAuthority('resources.update_status')")
    public ResponseEntity<ResourceResponse> updateStatus(
            @PathVariable UUID resourceId,
            @Valid @RequestBody UpdateResourceStatusRequest request
    ) {
        return ResponseEntity.ok(resourceService.updateStatus(resourceId, request));
    }

    @Operation(summary = "Delete resource (admin)")
    @DeleteMapping("/{resourceId}")
    @PreAuthorize("hasAuthority('resources.delete')")
    public ResponseEntity<Void> deleteResource(@PathVariable UUID resourceId) {
        resourceService.deleteResource(resourceId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "List all resource tags")
    @GetMapping("/tags")
    @PreAuthorize("hasAuthority('resources.read')")
    public ResponseEntity<List<ResourceTagResponse>> listTags() {
        return ResponseEntity.ok(resourceService.listTags());
    }
}