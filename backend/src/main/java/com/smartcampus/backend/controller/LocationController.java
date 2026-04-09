package com.smartcampus.backend.controller;

import com.smartcampus.backend.dto.resource.LocationRequest;
import com.smartcampus.backend.dto.resource.LocationResponse;
import com.smartcampus.backend.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Locations", description = "Campus location management")
@RestController
@RequestMapping("/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @Operation(summary = "List all locations")
    @GetMapping
    @PreAuthorize("hasAuthority('locations.read')")
    public ResponseEntity<List<LocationResponse>> listLocations(
            @RequestParam(required = false) String building,
            @RequestParam(required = false) Integer floor
    ) {
        return ResponseEntity.ok(locationService.listLocations(building, floor));
    }

    @Operation(summary = "Get location by ID")
    @GetMapping("/{locationId}")
    @PreAuthorize("hasAuthority('locations.read')")
    public ResponseEntity<LocationResponse> getLocationById(@PathVariable UUID locationId) {
        return ResponseEntity.ok(locationService.getLocationById(locationId));
    }

    @Operation(summary = "Create location (admin)")
    @PostMapping
    @PreAuthorize("hasAuthority('locations.create')")
    public ResponseEntity<LocationResponse> createLocation(@Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(locationService.createLocation(request));
    }

    @Operation(summary = "Update location (admin)")
    @PutMapping("/{locationId}")
    @PreAuthorize("hasAuthority('locations.update')")
    public ResponseEntity<LocationResponse> updateLocation(
            @PathVariable UUID locationId,
            @Valid @RequestBody LocationRequest request
    ) {
        return ResponseEntity.ok(locationService.updateLocation(locationId, request));
    }

    @Operation(summary = "Delete location (admin)")
    @DeleteMapping("/{locationId}")
    @PreAuthorize("hasAuthority('locations.delete')")
    public ResponseEntity<Void> deleteLocation(@PathVariable UUID locationId) {
        locationService.deleteLocation(locationId);
        return ResponseEntity.noContent().build();
    }
}