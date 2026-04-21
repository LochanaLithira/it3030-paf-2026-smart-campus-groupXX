import { apiClient } from './client';
import type {
  PageResponse,
  ResourceRequest,
  ResourceResponse,
  ResourceHeatmapPeriod,
  ResourceHeatmapResponse,
  ResourcesListParams,
  ResourceTagRequest,
  ResourceTagResponse,
  UpdateResourceStatusRequest,
} from '@/types/api';

export interface ResourceHeatmapParams {
  period?: ResourceHeatmapPeriod;
  startDate?: string;
  endDate?: string;
}

export const resourcesApi = {
  list: async (params: ResourcesListParams = {}): Promise<PageResponse<ResourceResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.type) searchParams.set('type', params.type);
    if (params.status) searchParams.set('status', params.status);
    if (params.tags) searchParams.set('tags', params.tags);
    if (params.search) searchParams.set('search', params.search);
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

  createTag: async (request: ResourceTagRequest): Promise<ResourceTagResponse> =>
    apiClient.post('resources/tags', { json: request }).json<ResourceTagResponse>(),

  updateTag: async (tagId: string, request: ResourceTagRequest): Promise<ResourceTagResponse> =>
    apiClient.put(`resources/tags/${tagId}`, { json: request }).json<ResourceTagResponse>(),

  deleteTag: async (tagId: string): Promise<void> => {
    await apiClient.delete(`resources/tags/${tagId}`);
  },

  getHeatmap: async (
    resourceId: string,
    params: ResourceHeatmapParams = {}
  ): Promise<ResourceHeatmapResponse> => {
    const searchParams = new URLSearchParams();
    if (params.period) searchParams.set('period', params.period);
    if (params.startDate) searchParams.set('start_date', params.startDate);
    if (params.endDate) searchParams.set('end_date', params.endDate);

    return apiClient
      .get(`resources/${resourceId}/heatmap`, { searchParams })
      .json<ResourceHeatmapResponse>();
  },
};