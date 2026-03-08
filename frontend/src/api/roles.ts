import { apiClient } from './client';
import type { RoleResponse, CreateRoleRequest, UpdateRoleRequest } from '@/types/api';

export const rolesApi = {
  list: async (): Promise<RoleResponse[]> => {
    return apiClient.get('roles').json<RoleResponse[]>();
  },

  create: async (request: CreateRoleRequest): Promise<RoleResponse> => {
    return apiClient.post('roles', { json: request }).json<RoleResponse>();
  },

  update: async (roleId: string, request: UpdateRoleRequest): Promise<RoleResponse> => {
    return apiClient.put(`roles/${roleId}`, { json: request }).json<RoleResponse>();
  },

  delete: async (roleId: string): Promise<void> => {
    await apiClient.delete(`roles/${roleId}`);
  },
};
