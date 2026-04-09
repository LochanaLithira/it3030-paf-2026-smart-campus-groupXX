package com.smartcampus.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "roles")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "role_id", updatable = false, nullable = false)
    private UUID roleId;

    @Column(name = "role_name", length = 50, unique = true, nullable = false)
    private String roleName;

    @Column(name = "permissions", nullable = false, columnDefinition = "text")
    private String permissionsStr = "";

    @Transient
    public List<String> getPermissions() {
        if (permissionsStr == null || permissionsStr.isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.asList(permissionsStr.split(","));
    }

    @Transient
    public void setPermissions(List<String> permissions) {
        this.permissionsStr = permissions == null || permissions.isEmpty() 
            ? "" 
            : String.join(",", permissions);
    }

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<UserRole> userRoles = new ArrayList<>();
}