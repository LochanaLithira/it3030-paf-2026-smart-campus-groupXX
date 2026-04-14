import { useMemo, useState } from 'react';
import { Bell, Circle } from 'lucide-react';
import { formatDistanceToNowStrict, isToday, isYesterday, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  categoryColor,
  limitNotifications,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadCountPolling,
} from '@/hooks/useNotifications';
import type { NotificationDTO } from '@/types/api';

function formatRelative(isoDate: string): string {
  const date = parseISO(isoDate);
  if (isToday(date)) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

function notificationDestination(notification: NotificationDTO): { to: string; hash?: string } {
  if (notification.referenceType === 'BOOKING' && notification.referenceId) {
    return { to: `/bookings/${notification.referenceId}` };
  }
  if (notification.referenceType === 'TICKET' && notification.referenceId) {
    return { to: `/tickets/${notification.referenceId}` };
  }
  if (notification.referenceType === 'COMMENT' && notification.referenceId) {
    return { to: `/tickets/${notification.referenceId}`, hash: 'comments' };
  }
  return { to: '/notifications' };
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const unreadQuery = useUnreadCountPolling(true);
  const notificationsQuery = useNotifications({});
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = useMemo(
    () => limitNotifications(notificationsQuery.data ?? [], 20),
    [notificationsQuery.data]
  );

  const unread = unreadQuery.data?.count ?? 0;
  const badgeText = unread > 9 ? '9+' : String(unread);

  const openAll = () => {
    setOpen(false);
    window.location.assign('/notifications');
  };

  const onClickNotification = async (n: NotificationDTO) => {
    if (!n.isRead) {
      await markAsRead.mutateAsync(n.id);
    }
    const destination = notificationDestination(n);
    setOpen(false);
    if (destination.hash) {
      window.location.assign(`${destination.to}#${destination.hash}`);
      return;
    }
    window.location.assign(destination.to);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {badgeText}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            Mark all as read
          </Button>
        </div>

        <Separator />

        <ScrollArea className="max-h-[420px]">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="rounded-md p-6 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onClickNotification(n)}
                  className="mb-2 w-full rounded-lg border border-transparent bg-background p-3 text-left transition hover:border-border hover:bg-muted/50"
                  style={{ borderLeft: `4px solid ${categoryColor(n.category)}` }}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!n.isRead ? <Circle className="h-2.5 w-2.5 fill-current text-blue-600" /> : null}
                      <p className={cn('text-sm', !n.isRead ? 'font-semibold' : 'font-medium')}>{n.title}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                </button>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full" onClick={openAll}>
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
