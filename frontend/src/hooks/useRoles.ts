import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '@/api/roles';
import type { CreateRoleRequest, UpdateRoleRequest } from '@/types/api';
import { toast } from 'sonner';

export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  detail: (id: string) => [...roleKeys.all, id] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: rolesApi.list,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateRoleRequest) => rolesApi.create(request),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success(`Role "${created.roleName}" created successfully`);
    },
    onError: () => {
      toast.error('Failed to create role');
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, request }: { roleId: string; request: UpdateRoleRequest }) =>
      rolesApi.update(roleId, request),
    onSuccess: (updated) => {
      qc.setQueryData(roleKeys.detail(updated.roleId), updated);
      qc.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success(`Role "${updated.roleName}" permissions updated`);
    },
    onError: () => {
      toast.error('Failed to update role');
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => rolesApi.delete(roleId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success('Role deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete role');
    },
  });
}
