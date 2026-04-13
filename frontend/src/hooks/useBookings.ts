import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingsApi, type BookingsListParams, parseApiError } from '@/api/bookings';
import type { BookingCreateRequest } from '@/types/api';

export function useBookings(params: BookingsListParams) {
  return useQuery({
    queryKey: ['bookings', params],
    queryFn: () => bookingsApi.list(params),
  });
}

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ['bookings', bookingId],
    queryFn: () => bookingsApi.getById(bookingId),
    enabled: Boolean(bookingId),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BookingCreateRequest) => bookingsApi.create(body),
    onSuccess: () => {
      toast.success('Booking request submitted');
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: async (err) => {
      const apiErr = await parseApiError(err);
      const details = (apiErr as any)?.details;
      const suggestions = Array.isArray(details?.suggestions) ? details.suggestions : null;
      if (suggestions?.length) {
        toast.error(`${apiErr?.message ?? 'Booking conflict'}. Suggested alternatives are available below.`);
      } else {
        toast.error(apiErr?.message ?? 'Failed to create booking');
      }
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.cancel(bookingId),
    onSuccess: () => {
      toast.success('Booking cancelled');
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: async (err) => {
      const apiErr = await parseApiError(err);
      toast.error(apiErr?.message ?? 'Failed to cancel booking');
    },
  });
}

export function useApproveBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingsApi.approve(bookingId),
    onSuccess: () => {
      toast.success('Booking approved');
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: async (err) => {
      const apiErr = await parseApiError(err);
      toast.error(apiErr?.message ?? 'Failed to approve booking');
    },
  });
}

export function useRejectBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, rejectionReason }: { bookingId: string; rejectionReason: string }) =>
      bookingsApi.reject(bookingId, rejectionReason),
    onSuccess: () => {
      toast.success('Booking rejected');
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: async (err) => {
      const apiErr = await parseApiError(err);
      toast.error(apiErr?.message ?? 'Failed to reject booking');
    },
  });
}

