import { apiClient } from '@/api/client';
import type {
  BulkReadResponse,
  NotificationCategory,
  NotificationDTO,
  NotificationPreferenceDTO,
  UnreadCountResponse,
  UpdatePreferenceRequest,
} from '@/types/api';

export interface NotificationsListParams {
  read?: boolean;
  category?: NotificationCategory;
}

export const notificationsApi = {
  getNotifications: async (params: NotificationsListParams = {}): Promise<NotificationDTO[]> => {
    const searchParams = new URLSearchParams();
    if (params.read !== undefined) {
      searchParams.set('read', String(params.read));
    }
    if (params.category) {
      searchParams.set('category', params.category);
    }

    return apiClient.get('notifications', { searchParams }).json<NotificationDTO[]>();
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> =>
    apiClient.get('notifications/unread-count').json<UnreadCountResponse>(),

  markAsRead: async (id: string): Promise<NotificationDTO> =>
    apiClient.patch(`notifications/${id}/read`).json<NotificationDTO>(),

  markAllAsRead: async (): Promise<BulkReadResponse> =>
    apiClient.patch('notifications/read-all').json<BulkReadResponse>(),

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`notifications/${id}`);
  },

  getPreferences: async (): Promise<NotificationPreferenceDTO[]> =>
    apiClient.get('notifications/preferences').json<NotificationPreferenceDTO[]>(),

  updatePreferences: async (prefList: UpdatePreferenceRequest[]): Promise<NotificationPreferenceDTO[]> =>
    apiClient.put('notifications/preferences', { json: prefList }).json<NotificationPreferenceDTO[]>(),
};
