package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {

    Optional<Role> findByRoleName(String roleName);

    List<Role> findByRoleNameIn(List<String> roleNames);

    boolean existsByRoleName(String roleName);
}
