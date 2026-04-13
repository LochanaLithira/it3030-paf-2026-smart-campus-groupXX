import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { toast } from 'sonner';
import { resourcesApi } from '@/api/resources';
import { locationKeys } from '@/hooks/useLocations';
import type {
  ResourceRequest,
  ResourceTagCreateRequest,
  ResourceTagUpdateRequest,
  ResourcesListParams,
  ResourceStatus,
} from '@/types/api';

export const resourceKeys = {
  all: ['resources'] as const,
  lists: () => [...resourceKeys.all, 'list'] as const,
  list: (params: ResourcesListParams) => [...resourceKeys.lists(), params] as const,
  detail: (id: string) => [...resourceKeys.all, id] as const,
  tags: () => [...resourceKeys.all, 'tags'] as const,
};

async function extractApiErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.clone().json()) as { message?: string };
      return body?.message || fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

export function useResources(params: ResourcesListParams = {}) {
  return useQuery({
    queryKey: resourceKeys.list(params),
    queryFn: () => resourcesApi.list(params),
  });
}

export function useResourceTags() {
  return useQuery({
    queryKey: resourceKeys.tags(),
    queryFn: resourcesApi.listTags,
  });
}

export function useCreateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: ResourceRequest) => resourcesApi.create(request),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      qc.invalidateQueries({ queryKey: resourceKeys.detail(created.resourceId) });
      toast.success(`Resource ${created.name} created`);
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to create resource')),
  });
}

export function useUpdateResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, request }: { resourceId: string; request: ResourceRequest }) =>
      resourcesApi.update(resourceId, request),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      qc.invalidateQueries({ queryKey: resourceKeys.detail(updated.resourceId) });
      toast.success('Resource updated');
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to update resource')),
  });
}

export function useUpdateResourceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, status }: { resourceId: string; status: ResourceStatus }) =>
      resourcesApi.updateStatus(resourceId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      toast.success('Resource status updated');
    },
    onError: async (error) =>
      toast.error(await extractApiErrorMessage(error, 'Failed to update resource status')),
  });
}

export function useDeleteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => resourcesApi.remove(resourceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      toast.success('Resource deleted');
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to delete resource')),
  });
}

export function useCreateResourceTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: ResourceTagCreateRequest) => resourcesApi.createTag(request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resourceKeys.tags() });
      qc.invalidateQueries({ queryKey: locationKeys.all });
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      toast.success('Tag created');
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to create tag')),
  });
}

export function useUpdateResourceTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tagId, request }: { tagId: string; request: ResourceTagUpdateRequest }) =>
      resourcesApi.updateTag(tagId, request),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resourceKeys.tags() });
      qc.invalidateQueries({ queryKey: locationKeys.all });
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      toast.success('Tag updated');
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to update tag')),
  });
}

export function useDeleteResourceTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => resourcesApi.deleteTag(tagId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: resourceKeys.tags() });
      qc.invalidateQueries({ queryKey: locationKeys.all });
      qc.invalidateQueries({ queryKey: resourceKeys.lists() });
      toast.success('Tag deleted');
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to delete tag')),
  });
}