package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.resource.LocationRequest;
import com.smartcampus.backend.dto.resource.LocationResponse;
import com.smartcampus.backend.exception.ConflictException;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.mapper.ResourceMapper;
import com.smartcampus.backend.model.Location;
import com.smartcampus.backend.repository.LocationRepository;
import com.smartcampus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final LocationRepository locationRepository;
    private final ResourceRepository resourceRepository;
    private final ResourceMapper resourceMapper;

    @Transactional(readOnly = true)
    public List<LocationResponse> listLocations(String building, Integer floor) {
        return locationRepository.findAllByFilters(blankToNull(building), floor).stream()
                .map(resourceMapper::toLocationResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LocationResponse getLocationById(UUID locationId) {
        return resourceMapper.toLocationResponse(findLocationOrThrow(locationId));
    }

    @Transactional
    public LocationResponse createLocation(LocationRequest request) {
        Location location = Location.builder()
                .buildingName(request.buildingName().trim())
                .floorNumber(request.floorNumber())
                .roomNumber(trimToNull(request.roomNumber()))
                .description(trimToNull(request.description()))
                .build();
        return resourceMapper.toLocationResponse(locationRepository.save(location));
    }

    @Transactional
    public LocationResponse updateLocation(UUID locationId, LocationRequest request) {
        Location location = findLocationOrThrow(locationId);
        location.setBuildingName(request.buildingName().trim());
        location.setFloorNumber(request.floorNumber());
        location.setRoomNumber(trimToNull(request.roomNumber()));
        location.setDescription(trimToNull(request.description()));
        return resourceMapper.toLocationResponse(locationRepository.save(location));
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
}