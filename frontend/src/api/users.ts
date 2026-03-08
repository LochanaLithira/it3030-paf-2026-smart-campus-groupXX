import { apiClient } from './client';
import type {
  PageResponse,
  UserResponse,
  UpdateRolesRequest,
  UsersListParams,
  CreateUserRequest,
} from '@/types/api';

export const usersApi = {
  create: async (request: CreateUserRequest): Promise<UserResponse> =>
    apiClient.post('users', { json: request }).json<UserResponse>(),

  list: async (params: UsersListParams = {}): Promise<PageResponse<UserResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.role) searchParams.set('role', params.role);
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive));
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.size !== undefined) searchParams.set('size', String(params.size));
    if (params.sort) searchParams.set('sort', params.sort);

    return apiClient.get('users', { searchParams }).json<PageResponse<UserResponse>>();
  },

  me: async (): Promise<UserResponse> => {
    return apiClient.get('users/me').json<UserResponse>();
  },

  getById: async (userId: string): Promise<UserResponse> => {
    return apiClient.get(`users/${userId}`).json<UserResponse>();
  },

  updateRoles: async (userId: string, request: UpdateRolesRequest): Promise<UserResponse> => {
    return apiClient.patch(`users/${userId}/roles`, { json: request }).json<UserResponse>();
  },

  deactivate: async (userId: string): Promise<void> => {
    await apiClient.patch(`users/${userId}/deactivate`);
  },
};
