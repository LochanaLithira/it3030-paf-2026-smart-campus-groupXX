import { apiClient } from './client';
import type {
  PageResponse,
  ResourceRequest,
  ResourceResponse,
  ResourcesListParams,
  ResourceTagResponse,
  UpdateResourceStatusRequest,
} from '@/types/api';

export const resourcesApi = {
  list: async (params: ResourcesListParams = {}): Promise<PageResponse<ResourceResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set('type', params.type);
    if (params.status) searchParams.set('status', params.status);
    if (params.locationId) searchParams.set('locationId', params.locationId);
    if (params.tags) searchParams.set('tags', params.tags);
    if (params.search) searchParams.set('search', params.search);
    if (params.minCapacity !== undefined) searchParams.set('minCapacity', String(params.minCapacity));
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.size !== undefined) searchParams.set('size', String(params.size));
    if (params.sort) searchParams.set('sort', params.sort);
    return apiClient.get('resources', { searchParams }).json<PageResponse<ResourceResponse>>();
  },

  getById: async (resourceId: string): Promise<ResourceResponse> =>
    apiClient.get(`resources/${resourceId}`).json<ResourceResponse>(),

  create: async (request: ResourceRequest): Promise<ResourceResponse> =>
    apiClient.post('resources', { json: request }).json<ResourceResponse>(),

  update: async (resourceId: string, request: ResourceRequest): Promise<ResourceResponse> =>
    apiClient.put(`resources/${resourceId}`, { json: request }).json<ResourceResponse>(),

  updateStatus: async (resourceId: string, request: UpdateResourceStatusRequest): Promise<ResourceResponse> =>
    apiClient.patch(`resources/${resourceId}/status`, { json: request }).json<ResourceResponse>(),

  remove: async (resourceId: string): Promise<void> => {
    await apiClient.delete(`resources/${resourceId}`);
  },

  listTags: async (): Promise<ResourceTagResponse[]> =>
    apiClient.get('resources/tags').json<ResourceTagResponse[]>(),
};
