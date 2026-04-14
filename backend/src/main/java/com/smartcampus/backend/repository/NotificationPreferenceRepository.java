package com.smartcampus.backend.repository;

import com.smartcampus.backend.model.NotificationPreference;
import com.smartcampus.backend.model.enums.NotificationCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, UUID> {

    List<NotificationPreference> findByUserUserId(UUID userId);

    Optional<NotificationPreference> findByUserUserIdAndCategory(UUID userId, NotificationCategory category);

    boolean existsByUserUserIdAndCategory(UUID userId, NotificationCategory category);
}
