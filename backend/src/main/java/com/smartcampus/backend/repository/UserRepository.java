package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    Optional<User> findByOauthProviderAndOauthProviderId(String oauthProvider, String oauthProviderId);

    boolean existsByEmail(String email);

    @Query("""
            SELECT DISTINCT u FROM User u
            LEFT JOIN FETCH u.userRoles ur
            LEFT JOIN FETCH ur.role r
            WHERE (:search IS NULL OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:isActive IS NULL OR u.isActive = :isActive)
            """)
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
}
