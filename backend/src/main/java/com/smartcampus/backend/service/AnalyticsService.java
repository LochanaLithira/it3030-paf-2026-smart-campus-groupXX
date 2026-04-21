package com.smartcampus.backend.service;

import com.smartcampus.backend.dto.analytics.PeakHourResponse;
import com.smartcampus.backend.dto.analytics.TopHourItemResponse;
import com.smartcampus.backend.dto.analytics.TopResourceResponse;
import com.smartcampus.backend.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final BookingRepository bookingRepository;

    public List<TopResourceResponse> getTopResources(int limit) {
        return bookingRepository.findTopResources(limit).stream()
                .map(agg -> new TopResourceResponse(
                        agg.getResourceName(),
                        agg.getBookingCount()
                ))
                .collect(Collectors.toList());
    }

    public List<PeakHourResponse> getPeakBookingHours() {
        return bookingRepository.findPeakBookingHours().stream()
                .map(agg -> new PeakHourResponse(
                        agg.getHourOfDay(),
                        agg.getBookingCount()
                ))
                .collect(Collectors.toList());
    }

    public List<TopHourItemResponse> getTopItemsForHour(int hourOfDay, int limit) {
        return bookingRepository.findTopItemsForHour(hourOfDay, limit).stream()
                .map(agg -> new TopHourItemResponse(
                        agg.getItemName(),
                        agg.getBookingCount()
                ))
                .collect(Collectors.toList());
    }
}
