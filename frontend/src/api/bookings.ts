import { apiClient } from '@/api/client';
import type { ApiError, BookingAvailabilityResponse, BookingCreateRequest, BookingResponse, BookingStatus, PageResponse } from '@/types/api';

export interface BookingsListParams {
  status?: BookingStatus;
  resourceId?: string;
  locationId?: string;
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const bookingsApi = {
  list: async (params: BookingsListParams): Promise<PageResponse<BookingResponse>> => {
    const res = await apiClient.get('bookings', { searchParams: params as any });
    return res.json<PageResponse<BookingResponse>>();
  },

  getById: async (bookingId: string): Promise<BookingResponse> => {
    const res = await apiClient.get(`bookings/${bookingId}`);
    return res.json<BookingResponse>();
  },

  create: async (body: BookingCreateRequest): Promise<BookingResponse> => {
    const res = await apiClient.post('bookings', { json: body });
    return res.json<BookingResponse>();
  },

  cancel: async (bookingId: string): Promise<BookingResponse> => {
    const res = await apiClient.patch(`bookings/${bookingId}/cancel`);
    return res.json<BookingResponse>();
  },

  approve: async (bookingId: string): Promise<BookingResponse> => {
    const res = await apiClient.patch(`bookings/${bookingId}/approve`);
    return res.json<BookingResponse>();
  },

  reject: async (bookingId: string, rejectionReason: string): Promise<BookingResponse> => {
    const res = await apiClient.patch(`bookings/${bookingId}/reject`, { json: { rejectionReason } });
    return res.json<BookingResponse>();
  },

  availability: async (resourceId: string, date: string): Promise<BookingAvailabilityResponse> => {
    const res = await apiClient.get('bookings/availability', { searchParams: { resourceId, date } });
    return res.json<BookingAvailabilityResponse>();
  },
};

export async function parseApiError(err: unknown): Promise<ApiError | null> {
  if (!err || typeof err !== 'object') return null;
  const anyErr = err as any;
  const resp: Response | undefined = anyErr?.response;
  if (!resp) return null;
  try {
    return (await resp.json()) as ApiError;
  } catch {
    return null;
  }
}

