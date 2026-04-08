import { apiClient } from './client';
import type {
  PageResponse,
  TicketRequest,
  TicketResponse,
  TicketSummaryResponse,
  TicketCommentRequest,
  TicketCommentResponse,
  TicketAssignRequest,
  TicketStatusUpdateRequest,
  TicketAttachmentResponse,
  TicketsListParams,
} from '@/types/api';

export const ticketsApi = {
  /**
   * Create a new ticket with optional file attachments
   */
  create: async (request: TicketRequest): Promise<TicketResponse> => {
    const formData = new FormData();
    
    // Build the ticket request JSON (without files)
    const ticketData = {
      resourceId: request.resourceId,
      category: request.category,
      description: request.description,
      priority: request.priority,
      preferredContactDetails: request.preferredContactDetails,
      dueDate: request.dueDate,
    };
    
    formData.append('request', new Blob([JSON.stringify(ticketData)], { type: 'application/json' }));
    
    // Add files if present
    if (request.attachments && request.attachments.length > 0) {
      request.attachments.forEach((file) => {
        formData.append('files', file);
      });
    }
    
    // Use fetch directly for multipart/form-data (ky doesn't handle FormData well with Blob)
    const token = localStorage.getItem('accessToken');
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/tickets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create ticket' }));
      throw new Error(error.message || 'Failed to create ticket');
    }
    
    return response.json();
  },

  /**
   * List tickets with optional filters
   * Role-based: users see own tickets, technicians see assigned, admins see all
   */
  list: async (params: TicketsListParams = {}): Promise<PageResponse<TicketSummaryResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.priority) searchParams.set('priority', params.priority);
    if (params.category) searchParams.set('category', params.category);
    if (params.resourceId) searchParams.set('resourceId', params.resourceId);
    if (params.page !== undefined) searchParams.set('page', String(params.page));
    if (params.size !== undefined) searchParams.set('size', String(params.size));
    if (params.sort) searchParams.set('sort', params.sort);

    return apiClient.get('tickets', { searchParams }).json<PageResponse<TicketSummaryResponse>>();
  },

  /**
   * Get ticket by ID with full details (attachments, comments, history)
   */
  getById: async (ticketId: string): Promise<TicketResponse> =>
    apiClient.get(`tickets/${ticketId}`).json<TicketResponse>(),

  /**
   * Update ticket status (technician or admin only)
   */
  updateStatus: async (
    ticketId: string,
    request: TicketStatusUpdateRequest
  ): Promise<TicketResponse> =>
    apiClient.patch(`tickets/${ticketId}/status`, { json: request }).json<TicketResponse>(),

  /**
   * Assign ticket to a technician (admin only)
   */
  assign: async (ticketId: string, request: TicketAssignRequest): Promise<TicketResponse> =>
    apiClient.patch(`tickets/${ticketId}/assign`, { json: request }).json<TicketResponse>(),

  /**
   * Add comment to a ticket
   */
  addComment: async (
    ticketId: string,
    request: TicketCommentRequest
  ): Promise<TicketCommentResponse> =>
    apiClient.post(`tickets/${ticketId}/comments`, { json: request }).json<TicketCommentResponse>(),

  /**
   * Update a comment (owner or admin only)
   */
  updateComment: async (
    ticketId: string,
    commentId: string,
    request: TicketCommentRequest
  ): Promise<TicketCommentResponse> =>
    apiClient
      .put(`tickets/${ticketId}/comments/${commentId}`, { json: request })
      .json<TicketCommentResponse>(),

  /**
   * Delete a comment (owner or admin only)
   */
  deleteComment: async (ticketId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`tickets/${ticketId}/comments/${commentId}`);
  },

  /**
   * Upload attachment (max 3 per ticket, 3MB each)
   */
  uploadAttachment: async (ticketId: string, file: File): Promise<TicketAttachmentResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiClient
      .post(`tickets/${ticketId}/attachments`, { body: formData })
      .json<TicketAttachmentResponse>();
  },

  /**
   * Delete an attachment
   */
  deleteAttachment: async (ticketId: string, attachmentId: string): Promise<void> => {
    await apiClient.delete(`tickets/${ticketId}/attachments/${attachmentId}`);
  },
};
