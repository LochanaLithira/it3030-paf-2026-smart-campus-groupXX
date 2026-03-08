package com.smartcampus.backend.model;

import java.io.Serializable;
import java.util.UUID;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class UserRoleId implements Serializable {
    private UUID userId;
    private UUID roleId;
}
