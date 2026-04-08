package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.resource.*;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.exception.UnauthorizedException;
import com.smartcampus.backend.mapper.ResourceMapper;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.model.enums.ResourceStatus;
import com.smartcampus.backend.model.enums.ResourceType;
import com.smartcampus.backend.repository.LocationRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import com.smartcampus.backend.repository.ResourceTagRepository;
import com.smartcampus.backend.repository.UserRepository;
import com.smartcampus.backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors; // <-- ADD THIS

@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public Page<ResourceResponse> listResources(
            ResourceType type,
            ResourceStatus status,
            UUID locationId,
            String tags,
            String search,
            Integer minCapacity,
            Pageable pageable
    ) {
        String tagName = extractSingleTag(tags);

        // Step 1: paginate safely on base table — no collection JOIN FETCH
        Page<Resource> page = resourceRepository.findPagedWithFilters(
                type, status, locationId, minCapacity, blankToNull(search), tagName, pageable
        );

        if (page.isEmpty()) {
            return page.map(this::buildResourceResponse);
        }

        // Step 2: hydrate the current page's resources with all associations
        List<UUID> ids = page.getContent().stream()
                .map(Resource::getResourceId)
                .toList();

        Map<UUID, Resource> hydrated = resourceRepository.findAllWithDetailsByIds(ids)
                .stream()
                .collect(Collectors.toMap(Resource::getResourceId, r -> r));

        // Step 3: map preserving original page metadata (total count, page number, etc.)
        return page.map(r -> buildResourceResponse(
                hydrated.getOrDefault(r.getResourceId(), r)
        ));
    }

    // ---- Everything below this line is UNCHANGED ----

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(UUID resourceId) {
        return toResourceResponse(findResourceOrThrow(resourceId));
    }

    @Transactional(readOnly = true)
    public List<ResourceTagResponse> listTags() {
        return resourceTagRepository.findAll().stream()
                .sorted(Comparator.comparing(ResourceTag::getTagName, String.CASE_INSENSITIVE_ORDER))
                .map(resourceMapper::toTagResponse)
                .toList();
    }

    @Transactional
    public ResourceResponse createResource(ResourceRequest request) {
        validateAvailability(request.availability());

        Resource resource = Resource.builder()
                .availability(new ArrayList<>())
                .tagMappings(new ArrayList<>())
                .build();
        applyRequestToResource(resource, request);
        resource.setStatus(request.status() == null ? ResourceStatus.ACTIVE : request.status());
        resource.setCreatedBy(resolveCurrentUser());
        Resource saved = resourceRepository.save(resource);
        replaceTags(saved, request.tagIds());
        saved = resourceRepository.save(saved);

        return buildResourceResponse(saved);
    }

    @Transactional
    public ResourceResponse updateResource(UUID resourceId, ResourceRequest request) {
        validateAvailability(request.availability());

        Resource resource = findResourceOrThrow(resourceId);
        applyRequestToResource(resource, request);
        if (request.status() != null) {
            resource.setStatus(request.status());
        }
        replaceTags(resource, request.tagIds());
        resource = resourceRepository.save(resource);

        return buildResourceResponse(resource);
    }

    @Transactional
    public ResourceResponse updateStatus(UUID resourceId, UpdateResourceStatusRequest request) {
        Resource resource = findResourceOrThrow(resourceId);
        resource.setStatus(request.status());
        resource = resourceRepository.save(resource);

        return buildResourceResponse(resource);
    }

    @Transactional
    public void deleteResource(UUID resourceId) {
        resourceRepository.delete(findResourceOrThrow(resourceId));
    }

    private Resource findResourceOrThrow(UUID resourceId) {
        return resourceRepository.findByIdWithDetails(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", resourceId));
    }

    private void applyRequestToResource(Resource resource, ResourceRequest request) {
        resource.setName(request.name().trim());
        resource.setType(request.type());
        resource.setCapacity(request.capacity());
        resource.setDescription(trimToNull(request.description()));
        resource.setImageUrl(trimToNull(request.imageUrl()));
        resource.setLocation(resolveLocation(request.locationId()));
        replaceAvailability(resource, request.availability());
    }

    private void replaceAvailability(Resource resource, List<ResourceAvailabilityRequest> availability) {
        if (resource.getAvailability() == null) {
            resource.setAvailability(new ArrayList<>());
        }
        resource.getAvailability().clear();

        if (availability == null || availability.isEmpty()) {
            return;
        }

        for (ResourceAvailabilityRequest slot : availability) {
            ResourceAvailability mapped = ResourceAvailability.builder()
                    .resource(resource)
                    .dayOfWeek(slot.dayOfWeek())
                    .startTime(slot.startTime())
                    .endTime(slot.endTime())
                    .build();
            resource.getAvailability().add(mapped);
        }
    }

    private void replaceTags(Resource resource, List<UUID> tagIds) {
        if (resource.getTagMappings() == null) {
            resource.setTagMappings(new ArrayList<>());
        }
        resource.getTagMappings().clear();

        if (tagIds == null || tagIds.isEmpty()) {
            return;
        }

        List<ResourceTag> tags = resourceTagRepository.findByTagIdIn(tagIds);
        Set<UUID> uniqueTagIds = new HashSet<>(tagIds);
        if (tags.size() != uniqueTagIds.size()) {
            List<UUID> foundIds = tags.stream().map(ResourceTag::getTagId).toList();
            List<UUID> missingIds = uniqueTagIds.stream()
                    .filter(id -> !foundIds.contains(id))
                    .toList();
            throw new ResourceNotFoundException("Tag IDs not found: " + missingIds);
        }

        for (ResourceTag tag : tags) {
            ResourceTagMap mapping = ResourceTagMap.builder()
                    .resourceId(resource.getResourceId())
                    .tagId(tag.getTagId())
                    .resource(resource)
                    .tag(tag)
                    .build();
            resource.getTagMappings().add(mapping);
        }
    }

    private Location resolveLocation(UUID locationId) {
        if (locationId == null) {
            return null;
        }
        return locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location", locationId));
    }

    private User resolveCurrentUser() {
        try {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            return userRepository.findById(currentUserId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", currentUserId));
        } catch (IllegalStateException e) {
            throw new UnauthorizedException("User must be authenticated to perform this operation");
        }
    }

    private ResourceResponse toResourceResponse(Resource resource) {
        Resource hydrated = resourceRepository.findByIdWithDetails(resource.getResourceId())
                .orElse(resource);
        return buildResourceResponse(hydrated);
    }

    private ResourceResponse buildResourceResponse(Resource resource) {
        ResourceResponse base = resourceMapper.toResourceResponse(resource);
        return new ResourceResponse(
                base.resourceId(),
                base.name(),
                base.type(),
                base.capacity(),
                base.status(),
                base.description(),
                base.imageUrl(),
                base.createdBy(),
                base.createdAt(),
                resource.getLocation() == null ? null : resourceMapper.toResourceLocationResponse(resource.getLocation()),
                resource.getTagMappings().stream()
                        .map(ResourceTagMap::getTag)
                        .filter(Objects::nonNull)
                        .map(resourceMapper::toTagResponse)
                        .toList(),
                resource.getAvailability().stream()
                        .map(resourceMapper::toAvailabilityResponse)
                        .toList()
        );
    }

    private String trimToNull(String input) {
        if (input == null) return null;
        String trimmed = input.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String blankToNull(String input) {
        return trimToNull(input);
    }

    private String extractSingleTag(String tagsParam) {
        String tags = blankToNull(tagsParam);
        if (tags == null) return null;
        String[] parts = tags.split(",");
        return parts.length == 0 ? null : blankToNull(parts[0]);
    }

    private void validateAvailability(List<ResourceAvailabilityRequest> availability) {
        if (availability == null) return;
        Set<String> uniqueDayAndTime = new HashSet<>();
        for (ResourceAvailabilityRequest slot : availability) {
            if (slot.startTime() != null && slot.endTime() != null
                    && !slot.endTime().isAfter(slot.startTime())) {
                throw new AppException("Availability end time must be after start time",
                        HttpStatus.UNPROCESSABLE_ENTITY);
            }
            String key = slot.dayOfWeek() + "|" + slot.startTime() + "|" + slot.endTime();
            if (!uniqueDayAndTime.add(key)) {
                throw new AppException("Duplicate availability slots are not allowed",
                        HttpStatus.UNPROCESSABLE_ENTITY);
            }
        }
    }
}