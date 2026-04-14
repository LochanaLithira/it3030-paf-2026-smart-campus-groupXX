package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.notification.NotificationPreferenceDTO;
import com.smartcampus.backend.dto.notification.UpdatePreferenceRequest;
import com.smartcampus.backend.exception.ResourceNotFoundException;
import com.smartcampus.backend.model.NotificationPreference;
import com.smartcampus.backend.model.User;
import com.smartcampus.backend.model.enums.NotificationCategory;
import com.smartcampus.backend.repository.NotificationPreferenceRepository;
import com.smartcampus.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    @Transactional
    public void initDefaultPreferences(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        for (NotificationCategory category : NotificationCategory.values()) {
            if (!preferenceRepository.existsByUserUserIdAndCategory(userId, category)) {
                preferenceRepository.save(NotificationPreference.builder()
                        .user(user)
                        .category(category)
                        .enabled(true)
                        .build());
            }
        }
    }

    @Transactional
    public List<NotificationPreferenceDTO> getPreferencesForUser(UUID userId) {
        initDefaultPreferences(userId);

        return preferenceRepository.findByUserUserId(userId).stream()
                .sorted(Comparator.comparing(NotificationPreference::getCategory))
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public List<NotificationPreferenceDTO> updatePreferences(UUID userId, List<UpdatePreferenceRequest> updates) {
        initDefaultPreferences(userId);

        Map<NotificationCategory, UpdatePreferenceRequest> updateMap = updates.stream()
                .collect(Collectors.toMap(UpdatePreferenceRequest::category, Function.identity(), (a, b) -> b));

        List<NotificationPreference> preferences = new ArrayList<>(preferenceRepository.findByUserUserId(userId));
        for (NotificationPreference preference : preferences) {
            UpdatePreferenceRequest request = updateMap.get(preference.getCategory());
            if (request != null) {
                preference.setEnabled(Boolean.TRUE.equals(request.enabled()));
            }
        }

        preferenceRepository.saveAll(preferences);

        return preferences.stream()
                .sorted(Comparator.comparing(NotificationPreference::getCategory))
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isNotificationEnabled(UUID userId, NotificationCategory category) {
        return preferenceRepository.findByUserUserIdAndCategory(userId, category)
                .map(NotificationPreference::isEnabled)
                .orElse(true);
    }

    private NotificationPreferenceDTO toDto(NotificationPreference preference) {
        return new NotificationPreferenceDTO(
                preference.getPreferenceId(),
                preference.getUser().getUserId().toString(),
                preference.getCategory(),
                preference.isEnabled()
        );
    }
}
