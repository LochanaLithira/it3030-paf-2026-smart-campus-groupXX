package com.smartcampus.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "location_tag_map")
@IdClass(LocationTagMapId.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationTagMap {

    @Id
    @Column(name = "location_id", nullable = false)
    private UUID locationId;

    @Id
    @Column(name = "tag_id", nullable = false)
    private UUID tagId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", insertable = false, updatable = false)
    private Location location;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", insertable = false, updatable = false)
    private ResourceTag tag;
}
