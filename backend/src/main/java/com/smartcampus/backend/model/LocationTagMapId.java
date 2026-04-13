package com.smartcampus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LocationTagMapId implements Serializable {
    private UUID locationId;
    private UUID tagId;
}
