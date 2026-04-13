package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.resource.*;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.ConflictException;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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
        String typeStr = type != null ? type.name() : null;
        String statusStr = status != null ? status.name() : null;
        // Use PageRequest without Sort to avoid camelCase column name issues with native query
        Pageable unsortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

        // Step 1: Get the paged IDs via native query (no lazy collections loaded here)
        Page<Resource> idPage = resourceRepository.findAllWithFilters(
                typeStr, statusStr, locationId, minCapacity, blankToNull(search), tagName, unsortedPageable
        );

        if (idPage.isEmpty()) {
            return idPage.map(this::buildResourceResponse);
        }

        // Step 2: Hydrate full entity graph via two separate JPQL queries within the same
        // transaction. Hibernate's 1st-level cache merges availability onto the same entity
        // instances already loaded by findAllWithTagsByIds.
        List<UUID> ids = idPage.getContent().stream()
                .map(Resource::getResourceId)
                .collect(Collectors.toList());
        List<Resource> hydrated = resourceRepository.findAllWithTagsByIds(ids);
        resourceRepository.findAllWithAvailabilityByIds(ids); // populates availability on cached entities


        // Build a lookup map to preserve original page ordering
        Map<UUID, Resource> hydratedMap = hydrated.stream()
                .collect(Collectors.toMap(Resource::getResourceId, r -> r));

        // Step 3: Map to responses in the same order as the original page
        List<ResourceResponse> responses = ids.stream()
                .map(id -> hydratedMap.getOrDefault(id, null))
                .filter(Objects::nonNull)
                .map(this::buildResourceResponse)
                .collect(Collectors.toList());

        return new org.springframework.data.domain.PageImpl<>(responses, unsortedPageable, idPage.getTotalElements());
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
    public ResourceTagResponse createTag(ResourceTagCreateRequest request) {
        String name = request.tagName().trim();
        if (resourceTagRepository.findByTagNameIgnoreCase(name).isPresent()) {
            throw new ConflictException("A tag with this name already exists");
        }
        ResourceTag tag = ResourceTag.builder().tagName(name).build();
        return resourceMapper.toTagResponse(resourceTagRepository.save(tag));
    }

    @Transactional
    public ResourceTagResponse updateTag(UUID tagId, ResourceTagUpdateRequest request) {
        ResourceTag tag = resourceTagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));
        String name = request.tagName().trim();
        if (resourceTagRepository.existsOtherWithNameIgnoreCase(name, tagId)) {
            throw new ConflictException("A tag with this name already exists");
        }
        tag.setTagName(name);
        return resourceMapper.toTagResponse(resourceTagRepository.save(tag));
    }

    @Transactional
    public void deleteTag(UUID tagId) {
        ResourceTag tag = resourceTagRepository.findById(tagId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", tagId));
        resourceTagRepository.delete(tag);
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
        Resource resource = resourceRepository.findByIdWithTags(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource", resourceId));
        resourceRepository.findByIdWithAvailability(resourceId); // merges availability via 1st-level cache
        return resource;
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
        Resource hydrated = resourceRepository.findByIdWithTags(resource.getResourceId())
                .orElse(resource);
        resourceRepository.findByIdWithAvailability(resource.getResourceId()); // merges availability
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