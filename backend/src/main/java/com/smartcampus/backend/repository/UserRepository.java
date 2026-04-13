package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);

    boolean existsByEmail(String email);

    @Query(value = """
            SELECT DISTINCT u.* FROM users u
            LEFT JOIN user_roles ur ON u.user_id = ur.user_id
            LEFT JOIN roles r ON r.role_id = ur.role_id
            WHERE (:search IS NULL OR u.email ILIKE '%' || :search || '%'
                   OR u.full_name ILIKE '%' || :search || '%')
              AND (:isActive IS NULL OR u.is_active = :isActive)
            ORDER BY u.created_at ASC
            """, 
            countQuery = """
            SELECT COUNT(DISTINCT u.user_id) FROM users u
            LEFT JOIN user_roles ur ON u.user_id = ur.user_id
            LEFT JOIN roles r ON r.role_id = ur.role_id
            WHERE (:search IS NULL OR u.email ILIKE '%' || :search || '%'
                   OR u.full_name ILIKE '%' || :search || '%')
              AND (:isActive IS NULL OR u.is_active = :isActive)
            """,
            nativeQuery = true)
    Page<User> findAllWithFilters(
            @Param("search") String search,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN FETCH u.userRoles ur
            LEFT JOIN FETCH ur.role r
            WHERE u.userId = :userId
            """)
    Optional<User> findByIdWithRoles(@Param("userId") UUID userId);

    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN FETCH u.userRoles ur
            LEFT JOIN FETCH ur.role r
            WHERE u.email = :email
            """)
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("""
            SELECT DISTINCT u FROM User u
            JOIN u.userRoles ur
            JOIN ur.role r
            WHERE r.roleName = :roleName
            """)
    Page<User> findAllByRoleName(@Param("roleName") String roleName, Pageable pageable);

    @Query("""
            SELECT DISTINCT u.userId FROM User u
            JOIN u.userRoles ur
            JOIN ur.role r
            WHERE r.roleName = 'ADMIN'
            """)
    List<UUID> findAllAdminUserIds();
}