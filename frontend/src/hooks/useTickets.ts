import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { ticketsApi } from '@/api/tickets';
import type {
  TicketRequest,
  TicketResponse,
  TicketCommentRequest,
  TicketAssignRequest,
  TicketStatusUpdateRequest,
  TicketsListParams,
  TicketStatus,
} from '@/types/api';
import { toast } from 'sonner';

export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params: TicketsListParams) => [...ticketKeys.lists(), params] as const,
  detail: (id: string) => [...ticketKeys.all, id] as const,
};

/**
 * Create a new ticket
 */
export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (request: TicketRequest) => ticketsApi.create(request),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success(`Ticket #${created.ticketId.slice(0, 8)} created successfully`);
    },
    onError: () => {
      toast.error('Failed to create ticket');
    },
  });
}

/**
 * List tickets with filters
 */
export function useTickets(params: TicketsListParams = {}) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => ticketsApi.list(params),
  });
}

/**
 * Get ticket details by ID
 */
export function useTicketById(
  ticketId: string,
  opts?: Partial<UseQueryOptions<TicketResponse>>
) {
  return useQuery({
    queryKey: ticketKeys.detail(ticketId),
    queryFn: () => ticketsApi.getById(ticketId),
    enabled: Boolean(ticketId),
    ...opts,
  });
}

/**
 * Update ticket status (with optional notes)
 */
export function useUpdateTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, status, notes }: { ticketId: string; status: TicketStatus; notes?: string }) =>
      ticketsApi.updateStatus(ticketId, { status, notes }),
    onSuccess: (updated) => {
      qc.setQueryData(ticketKeys.detail(updated.ticketId), updated);
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success(`Ticket status updated to ${updated.status}`);
    },
    onError: () => {
      toast.error('Failed to update ticket status');
    },
  });
}

/**
 * Assign ticket to a technician
 */
export function useAssignTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, technicianId }: { ticketId: string; technicianId: string }) =>
      ticketsApi.assign(ticketId, { technicianId }),
    onSuccess: (updated) => {
      qc.setQueryData(ticketKeys.detail(updated.ticketId), updated);
      qc.invalidateQueries({ queryKey: ticketKeys.lists() });
      toast.success(
        `Ticket assigned to ${updated.assignedTech?.fullName || 'technician'}`
      );
    },
    onError: () => {
      toast.error('Failed to assign ticket');
    },
  });
}

/**
 * Add a comment to a ticket
 */
export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, comment }: { ticketId: string; comment: string }) =>
      ticketsApi.addComment(ticketId, { comment }),
    onSuccess: (_comment, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      toast.success('Comment added');
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });
}

/**
 * Update a ticket comment
 */
export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      commentId,
      comment,
    }: {
      ticketId: string;
      commentId: string;
      comment: string;
    }) => ticketsApi.updateComment(ticketId, commentId, { comment }),
    onSuccess: (_comment, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      toast.success('Comment updated');
    },
    onError: () => {
      toast.error('Failed to update comment');
    },
  });
}

/**
 * Delete a ticket comment
 */
export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, commentId }: { ticketId: string; commentId: string }) =>
      ticketsApi.deleteComment(ticketId, commentId),
    onSuccess: (_data, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    },
  });
}

/**
 * Upload an attachment to a ticket
 */
export function useUploadTicketAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, file }: { ticketId: string; file: File }) =>
      ticketsApi.uploadAttachment(ticketId, file),
    onSuccess: (_attachment, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      toast.success('Attachment uploaded');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to upload attachment';
      toast.error(message);
    },
  });
}

/**
 * Delete a ticket attachment
 */
export function useDeleteTicketAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, attachmentId }: { ticketId: string; attachmentId: string }) =>
      ticketsApi.deleteAttachment(ticketId, attachmentId),
    onSuccess: (_data, { ticketId }) => {
      qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      toast.success('Attachment deleted');
    },
    onError: () => {
      toast.error('Failed to delete attachment');
    },
  });
}
