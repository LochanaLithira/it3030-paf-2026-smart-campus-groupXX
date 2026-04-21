import { apiClient } from './client';
import type { PeakHourResponse, TopResourceResponse, TopHourItemResponse } from '@/types/api';

export const analyticsApi = {
  getTopResources: async (limit: number = 5): Promise<TopResourceResponse[]> => {
    return apiClient.get('analytics/top-resources', { searchParams: { limit } }).json<TopResourceResponse[]>();
  },

  getPeakBookingHours: async (): Promise<PeakHourResponse[]> => {
    return apiClient.get('analytics/peak-hours').json<PeakHourResponse[]>();
  },

  getTopItemsForHour: async (hourOfDay: number, limit: number = 3): Promise<TopHourItemResponse[]> => {
    return apiClient.get(`analytics/peak-hours/${hourOfDay}/top-items`, { searchParams: { limit } }).json<TopHourItemResponse[]>();
  },
};
