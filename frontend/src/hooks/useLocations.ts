import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { toast } from 'sonner';
import { locationsApi } from '@/api/locations';
import type { LocationRequest, LocationsListParams } from '@/types/api';

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (params: LocationsListParams) => [...locationKeys.lists(), params] as const,
  detail: (id: string) => [...locationKeys.all, id] as const,
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

export function useLocations(params: LocationsListParams = {}) {
  return useQuery({
    queryKey: locationKeys.list(params),
    queryFn: () => locationsApi.list(params),
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: LocationRequest) => locationsApi.create(request),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() });
      toast.success(`Location ${created.buildingName} saved`);
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to create location')),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ locationId, request }: { locationId: string; request: LocationRequest }) =>
      locationsApi.update(locationId, request),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() });
      qc.invalidateQueries({ queryKey: locationKeys.detail(updated.locationId) });
      toast.success('Location updated');
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to update location')),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) => locationsApi.remove(locationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: locationKeys.lists() });
      toast.success('Location deleted');
    },
    onError: async (error) => toast.error(await extractApiErrorMessage(error, 'Failed to delete location')),
  });
}