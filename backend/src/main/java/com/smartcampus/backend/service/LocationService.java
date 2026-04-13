package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.resource.LocationRequest;
import com.smartcampus.backend.dto.resource.LocationResponse;
import com.smartcampus.backend.dto.resource.ResourceTagResponse;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.mapper.ResourceMapper;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.model.enums.AvailabilityRecurrenceType;
import com.smartcampus.backend.model.enums.ResourceType;
import com.smartcampus.backend.repository.LocationRepository;
import com.smartcampus.backend.repository.ResourceTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public List<LocationResponse> listLocations(String building, Integer floor) {
        return locationRepository.findAllByFilters(blankToNull(building), floor).stream()
                .map(this::toLocationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationResponse getLocationById(UUID locationId) {
        return toLocationResponse(findLocationOrThrow(locationId));
    }

    @Transactional
    public LocationResponse createLocation(LocationRequest request) {
        validateAvailability(request.availability());
        validateType(request.type());

        Location location = Location.builder()
                .buildingName(request.buildingName().trim())
                .floorNumber(request.floorNumber())
                .roomNumber(trimToNull(request.roomNumber()))
                .capacity(request.capacity())
                .type(request.type())
                .status(request.status())
                .availability(new ArrayList<>())
                .tagMappings(new ArrayList<>())
                .build();
        replaceAvailability(location, request.availability());
        Location saved = locationRepository.save(location);
        replaceTags(saved, request.tagIds());
        saved = locationRepository.save(saved);
        return toLocationResponse(saved);
    }

    @Transactional
    public LocationResponse updateLocation(UUID locationId, LocationRequest request) {
        validateAvailability(request.availability());
        validateType(request.type());

        Location location = findLocationOrThrow(locationId);
        location.setBuildingName(request.buildingName().trim());
        location.setFloorNumber(request.floorNumber());
        location.setRoomNumber(trimToNull(request.roomNumber()));
        location.setCapacity(request.capacity());
        location.setType(request.type());
        location.setStatus(request.status());
        replaceAvailability(location, request.availability());
        replaceTags(location, request.tagIds());
        return toLocationResponse(locationRepository.save(location));
    }

    @Transactional
    public void deleteLocation(UUID locationId) {
        Location location = findLocationOrThrow(locationId);
        
        // Let the database handle the constraint to avoid race conditions
        try {
            locationRepository.delete(location);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new ConflictException("Location cannot be deleted because it is referenced by resources");
        }
    }

    private Location findLocationOrThrow(UUID locationId) {
        return locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location", locationId));
    }

    private String trimToNull(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String blankToNull(String input) {
        return trimToNull(input);
    }

    private void validateType(ResourceType type) {
        if (type == ResourceType.EQUIPMENT) {
            throw new AppException("Location type cannot be EQUIPMENT", HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }

    private void validateAvailability(List<com.smartcampus.backend.dto.resource.LocationAvailabilityRequest> availability) {
        if (availability == null) return;
        Set<String> uniqueDayAndTime = new HashSet<>();
        for (var slot : availability) {
            if (slot.startTime() != null && slot.endTime() != null
                    && !slot.endTime().isAfter(slot.startTime())) {
                throw new AppException("Availability end time must be after start time",
                        HttpStatus.UNPROCESSABLE_ENTITY);
            }
            if (slot.recurrenceType() == AvailabilityRecurrenceType.WEEKLY && slot.dayOfWeek() == null) {
                throw new AppException("Weekly availability requires day of week", HttpStatus.UNPROCESSABLE_ENTITY);
            }
            if (slot.recurrenceType() == AvailabilityRecurrenceType.MONTHLY && slot.dayOfMonth() == null) {
                throw new AppException("Monthly availability requires day of month", HttpStatus.UNPROCESSABLE_ENTITY);
            }
            if (slot.recurrenceType() != AvailabilityRecurrenceType.WEEKLY && slot.dayOfWeek() != null) {
                throw new AppException("Day of week is only allowed for weekly availability", HttpStatus.UNPROCESSABLE_ENTITY);
            }
            if (slot.recurrenceType() != AvailabilityRecurrenceType.MONTHLY && slot.dayOfMonth() != null) {
                throw new AppException("Day of month is only allowed for monthly availability", HttpStatus.UNPROCESSABLE_ENTITY);
            }

            String key = slot.recurrenceType() + "|" + slot.dayOfWeek() + "|" + slot.dayOfMonth() + "|" + slot.startTime() + "|" + slot.endTime();
            if (!uniqueDayAndTime.add(key)) {
                throw new AppException("Duplicate availability slots are not allowed",
                        HttpStatus.UNPROCESSABLE_ENTITY);
            }
        }
    }

    private void replaceAvailability(Location location, List<com.smartcampus.backend.dto.resource.LocationAvailabilityRequest> availability) {
        if (location.getAvailability() == null) {
            location.setAvailability(new ArrayList<>());
        }
        location.getAvailability().clear();

        if (availability == null || availability.isEmpty()) {
            return;
        }

        for (var slot : availability) {
            LocationAvailability mapped = LocationAvailability.builder()
                    .location(location)
                    .recurrenceType(slot.recurrenceType())
                    .dayOfWeek(slot.dayOfWeek())
                    .dayOfMonth(slot.dayOfMonth())
                    .startTime(slot.startTime())
                    .endTime(slot.endTime())
                    .build();
            location.getAvailability().add(mapped);
        }
    }

    private void replaceTags(Location location, List<UUID> tagIds) {
        if (location.getTagMappings() == null) {
            location.setTagMappings(new ArrayList<>());
        }
        location.getTagMappings().clear();

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
            LocationTagMap mapping = LocationTagMap.builder()
                    .locationId(location.getLocationId())
                    .tagId(tag.getTagId())
                    .location(location)
                    .tag(tag)
                    .build();
            location.getTagMappings().add(mapping);
        }
    }

    private LocationResponse toLocationResponse(Location location) {
        LocationResponse base = resourceMapper.toLocationResponse(location);
        List<ResourceTagResponse> tags = location.getTagMappings().stream()
                .map(LocationTagMap::getTag)
                .filter(Objects::nonNull)
                .map(resourceMapper::toTagResponse)
                .toList();

        return new LocationResponse(
                base.locationId(),
                base.buildingName(),
                base.floorNumber(),
                base.roomNumber(),
                base.capacity(),
                base.type(),
                base.status(),
                tags,
                location.getAvailability().stream()
                        .map(resourceMapper::toLocationAvailabilityResponse)
                        .toList(),
                base.createdAt(),
                base.updatedAt()
        );
    }
}