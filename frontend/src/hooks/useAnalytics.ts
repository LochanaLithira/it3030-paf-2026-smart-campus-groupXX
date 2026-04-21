import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/api/analytics';

export const analyticsKeys = {
  all: ['analytics'] as const,
  topResources: (limit: number) => [...analyticsKeys.all, 'topResources', limit] as const,
  peakHours: () => [...analyticsKeys.all, 'peakHours'] as const,
  topItemsForHour: (hour: number, limit: number) => [...analyticsKeys.peakHours(), hour, 'topItems', limit] as const,
};

export function useTopResources(limit: number = 5) {
  return useQuery({
    queryKey: analyticsKeys.topResources(limit),
    queryFn: () => analyticsApi.getTopResources(limit),
  });
}

export function usePeakBookingHours() {
  return useQuery({
    queryKey: analyticsKeys.peakHours(),
    queryFn: () => analyticsApi.getPeakBookingHours(),
  });
}

export function useTopItemsForHour(hourOfDay: number, limit: number = 3) {
  return useQuery({
    queryKey: analyticsKeys.topItemsForHour(hourOfDay, limit),
    queryFn: () => analyticsApi.getTopItemsForHour(hourOfDay, limit),
  });
}
