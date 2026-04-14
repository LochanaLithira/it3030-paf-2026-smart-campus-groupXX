import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { toast } from 'sonner';
import { notificationsApi, type NotificationsListParams } from '@/api/notifications';
import type {
  NotificationCategory,
  NotificationPreferenceDTO,
  NotificationDTO,
  UpdatePreferenceRequest,
} from '@/types/api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: NotificationsListParams) => [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
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

export function useNotifications(params: NotificationsListParams = {}) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.getNotifications(params),
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.getUnreadCount,
    enabled,
  });
}

export function useUnreadCountPolling(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.getUnreadCount,
    enabled,
    refetchInterval: enabled ? 30_000 : false,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: async (error) => {
      toast.error(await extractApiErrorMessage(error, 'Failed to mark notification as read'));
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('All notifications marked as read');
    },
    onError: async (error) => {
      toast.error(await extractApiErrorMessage(error, 'Failed to mark all notifications as read'));
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.deleteNotification(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
      qc.invalidateQueries({ queryKey: notificationKeys.all });
      toast.success('Notification deleted');
    },
    onError: async (error) => {
      toast.error(await extractApiErrorMessage(error, 'Failed to delete notification'));
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationsApi.getPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: UpdatePreferenceRequest[]) => notificationsApi.updatePreferences(updates),
    onSuccess: (prefs) => {
      qc.setQueryData(notificationKeys.preferences(), prefs);
    },
    onError: async (error) => {
      toast.error(await extractApiErrorMessage(error, 'Failed to update preferences'));
    },
  });
}

export function deriveFilterMessage(
  filter: 'all' | 'unread' | 'bookings' | 'tickets' | 'comments'
): string {
  switch (filter) {
    case 'unread':
      return 'No unread notifications';
    case 'bookings':
      return 'No booking notifications';
    case 'tickets':
      return 'No ticket notifications';
    case 'comments':
      return 'No comment notifications';
    default:
      return 'No notifications here';
  }
}

export function categoryColor(category: NotificationCategory): string {
  switch (category) {
    case 'BOOKING':
      return '#2E75B6';
    case 'TICKET':
      return '#7030A0';
    case 'COMMENT':
      return '#1F7A8C';
    case 'SYSTEM':
    default:
      return '#888888';
  }
}

export function limitNotifications(notifications: NotificationDTO[], max = 20): NotificationDTO[] {
  return notifications.slice(0, max);
}

export function toPreferenceMap(list: NotificationPreferenceDTO[]): Record<NotificationCategory, boolean> {
  const defaults: Record<NotificationCategory, boolean> = {
    BOOKING: true,
    TICKET: true,
    COMMENT: true,
    SYSTEM: true,
  };

  for (const item of list) {
    defaults[item.category] = item.enabled;
  }
  return defaults;
}
