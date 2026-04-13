package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.resource.*;
import com.smartcampus.backend.exception.AppException;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.mapper.ResourceMapper;
import com.smartcampus.backend.model.*;
import com.smartcampus.backend.model.enums.ResourceType;
import com.smartcampus.backend.repository.LocationRepository;
import com.smartcampus.backend.repository.ResourceTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final ResourceTagRepository resourceTagRepository;
    private final ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public List<LocationResponse> listLocations(String building, Integer floor) {
        List<Location> base = locationRepository.findAllByFilters(blankToNull(building), floor);
        if (base.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = base.stream().map(Location::getLocationId).toList();
        List<Location> hydrated = locationRepository.findAllWithTagsByIds(ids);
        locationRepository.findAllWithAvailabilityByIds(ids);
        Map<UUID, Location> map = hydrated.stream().collect(Collectors.toMap(Location::getLocationId, l -> l));
        return ids.stream()
                .map(map::get)
                .filter(Objects::nonNull)
                .map(this::buildLocationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationResponse getLocationById(UUID locationId) {
        Location location = locationRepository.findByIdWithTags(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location", locationId));
        locationRepository.findByIdWithAvailability(locationId);
        return buildLocationResponse(location);
    }

    @Transactional
    public LocationResponse createLocation(LocationRequest request) {
        validateLocationType(request.type());
        validateAvailability(request.availability());

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
        Location saved = locationRepository.save(location);
        replaceAvailability(saved, request.availability());
        replaceTags(saved, request.tagIds());
        saved = locationRepository.save(saved);

        return buildLocationResponse(reloadForResponse(saved.getLocationId()));
    }

    @Transactional
    public LocationResponse updateLocation(UUID locationId, LocationRequest request) {
        validateLocationType(request.type());
        validateAvailability(request.availability());

        Location location = findLocationOrThrow(locationId);
        location.setBuildingName(request.buildingName().trim());
        location.setFloorNumber(request.floorNumber());
        location.setRoomNumber(trimToNull(request.roomNumber()));
        location.setCapacity(request.capacity());
        location.setType(request.type());
        location.setStatus(request.status());
        replaceAvailability(location, request.availability());
        replaceTags(location, request.tagIds());
        Location saved = locationRepository.save(location);

        return buildLocationResponse(reloadForResponse(saved.getLocationId()));
    }

    @Transactional
    public void deleteLocation(UUID locationId) {
        Location location = findLocationOrThrow(locationId);

        try {
            locationRepository.delete(location);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new ConflictException("Location cannot be deleted because it is referenced by resources");
        }
    }

    private Location reloadForResponse(UUID locationId) {
        Location withTags = locationRepository.findByIdWithTags(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location", locationId));
        locationRepository.findByIdWithAvailability(locationId);
        return withTags;
    }

    private LocationResponse buildLocationResponse(Location location) {
        return new LocationResponse(
                location.getLocationId(),
                location.getBuildingName(),
                location.getFloorNumber(),
                location.getRoomNumber(),
                location.getCapacity(),
                location.getType(),
                location.getStatus(),
                location.getTagMappings().stream()
                        .map(LocationTagMap::getTag)
                        .filter(Objects::nonNull)
                        .map(resourceMapper::toTagResponse)
                        .toList(),
                location.getAvailability().stream()
                        .map(a -> new ResourceAvailabilityResponse(
                                a.getAvailId(),
                                a.getDayOfWeek(),
                                a.getStartTime(),
                                a.getEndTime()))
                        .toList(),
                location.getCreatedAt(),
                location.getUpdatedAt()
        );
    }

    private void replaceAvailability(Location location, List<ResourceAvailabilityRequest> availability) {
        if (location.getAvailability() == null) {
            location.setAvailability(new ArrayList<>());
        }
        location.getAvailability().clear();

        if (availability == null || availability.isEmpty()) {
            return;
        }

        for (ResourceAvailabilityRequest slot : availability) {
            LocationAvailability mapped = LocationAvailability.builder()
                    .location(location)
                    .dayOfWeek(slot.dayOfWeek())
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

    private void validateLocationType(ResourceType type) {
        if (type == ResourceType.EQUIPMENT) {
            throw new AppException("Location type cannot be EQUIPMENT", HttpStatus.BAD_REQUEST);
        }
    }

    private void validateAvailability(List<ResourceAvailabilityRequest> availability) {
        if (availability == null) {
            return;
        }
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
