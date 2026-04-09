import { apiClient } from './client';
import type { LocationRequest, LocationResponse, LocationsListParams } from '@/types/api';

export const locationsApi = {
  list: async (params: LocationsListParams = {}): Promise<LocationResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params.building) searchParams.set('building', params.building);
    if (params.floor !== undefined) searchParams.set('floor', String(params.floor));
    return apiClient.get('locations', { searchParams }).json<LocationResponse[]>();
  },

  getById: async (locationId: string): Promise<LocationResponse> =>
    apiClient.get(`locations/${locationId}`).json<LocationResponse>(),

  create: async (request: LocationRequest): Promise<LocationResponse> =>
    apiClient.post('locations', { json: request }).json<LocationResponse>(),

  update: async (locationId: string, request: LocationRequest): Promise<LocationResponse> =>
    apiClient.put(`locations/${locationId}`, { json: request }).json<LocationResponse>(),

  remove: async (locationId: string): Promise<void> => {
    await apiClient.delete(`locations/${locationId}`);
  },
};