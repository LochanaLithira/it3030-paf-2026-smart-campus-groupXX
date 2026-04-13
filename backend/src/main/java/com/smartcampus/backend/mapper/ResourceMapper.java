package com.smartcampus.backend.mapper;

import com.smartcampus.backend.dto.resource.*;
import com.smartcampus.backend.model.LocationAvailability;
import com.smartcampus.backend.model.Location;
import com.smartcampus.backend.model.Resource;
import com.smartcampus.backend.model.ResourceAvailability;
import com.smartcampus.backend.model.ResourceTag;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ResourceMapper {

    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "availability", ignore = true)
    LocationResponse toLocationResponse(Location location);

    @Mapping(target = "locationId", source = "location.locationId")
    @Mapping(target = "buildingName", source = "location.buildingName")
    @Mapping(target = "floorNumber", source = "location.floorNumber")
    @Mapping(target = "roomNumber", source = "location.roomNumber")
    ResourceLocationResponse toResourceLocationResponse(Location location);

    ResourceTagResponse toTagResponse(ResourceTag tag);

    LocationAvailabilityResponse toLocationAvailabilityResponse(LocationAvailability availability);

    ResourceAvailabilityResponse toAvailabilityResponse(ResourceAvailability availability);

    @Mapping(target = "createdBy", source = "createdBy.userId")
    @Mapping(target = "location", ignore = true)
    @Mapping(target = "tags", ignore = true)
    @Mapping(target = "availability", ignore = true)
    ResourceResponse toResourceResponse(Resource resource);
}