import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import type {
  UserResponse,
  UpdateRolesRequest,
  UsersListParams,
  CreateUserRequest,
} from '@/types/api';
import { toast } from 'sonner';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params: UsersListParams) => [...userKeys.lists(), params] as const,
  me: () => [...userKeys.all, 'me'] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
};

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateUserRequest) => usersApi.create(request),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(`User ${created.fullName} created successfully`);
    },
    onError: () => {
      toast.error('Failed to create user');
    },
  });
}

export function useUsers(params: UsersListParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => usersApi.list(params),
  });
}

export function useCurrentUser(
  opts?: Partial<UseQueryOptions<UserResponse>>
) {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: usersApi.me,
    staleTime: 5 * 60 * 1000,
    ...opts,
  });
}

export function useUserById(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersApi.getById(userId),
    enabled: Boolean(userId),
  });
}

export function useUpdateUserRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: UpdateRolesRequest }) =>
      usersApi.updateRoles(userId, request),
    onSuccess: (updated) => {
      qc.setQueryData(userKeys.detail(updated.userId), updated);
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(`Roles updated for ${updated.fullName}`);
    },
    onError: () => {
      toast.error('Failed to update roles');
    },
  });
}

export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => usersApi.deactivate(userId),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: userKeys.detail(userId) });
      qc.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User deactivated successfully');
    },
    onError: () => {
      toast.error('Failed to deactivate user');
    },
  });
}
