package com.smartcampus.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "locations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"building_name", "floor_number", "room_number"})
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "location_id", updatable = false, nullable = false)
    private UUID locationId;

    @Column(name = "building_name", length = 100, nullable = false)
    private String buildingName;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;

    @Column(name = "room_number", length = 20)
    private String roomNumber;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "location", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Resource> resources = new ArrayList<>();
}