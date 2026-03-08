package com.smartcampus.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_roles")
@IdClass(UserRoleId.class)
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class UserRole {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Id
    @Column(name = "role_id", nullable = false)
    private UUID roleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", insertable = false, updatable = false)
    private Role role;

    @Column(name = "assigned_at", nullable = false)
    @Builder.Default
    private OffsetDateTime assignedAt = OffsetDateTime.now();
}
