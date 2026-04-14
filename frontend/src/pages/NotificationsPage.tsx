import { useMemo, useState } from 'react';
import { Trash2, Circle } from 'lucide-react';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  categoryColor,
  deriveFilterMessage,
  useDeleteNotification,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '@/hooks/useNotifications';
import type { NotificationCategory, NotificationDTO } from '@/types/api';

const PAGE_SIZE = 20;

type Filter = 'all' | 'unread' | 'bookings' | 'tickets' | 'comments';

function toApiFilter(filter: Filter): { read?: boolean; category?: NotificationCategory } {
  switch (filter) {
    case 'unread':
      return { read: false };
    case 'bookings':
      return { category: 'BOOKING' };
    case 'tickets':
      return { category: 'TICKET' };
    case 'comments':
      return { category: 'COMMENT' };
    default:
      return {};
  }
}

function destination(notification: NotificationDTO): { to: string; hash?: string } {
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

function NotificationRow({
  notification,
  onOpen,
  onDelete,
}: {
  notification: NotificationDTO;
  onOpen: (n: NotificationDTO) => void;
  onDelete: (n: NotificationDTO) => void;
}) {
  return (
    <div
      className="group rounded-lg border border-transparent bg-background p-4 transition hover:border-border hover:bg-muted/40"
      style={{ borderLeft: `4px solid ${categoryColor(notification.category)}` }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <button className="flex min-w-0 flex-1 items-start gap-2 text-left" onClick={() => onOpen(notification)}>
          {!notification.isRead ? <Circle className="mt-1 h-2.5 w-2.5 fill-current text-blue-600" /> : null}
          <div className="min-w-0">
            <p className={`text-sm ${notification.isRead ? 'font-medium' : 'font-semibold'}`}>{notification.title}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNowStrict(parseISO(notification.createdAt), { addSuffix: true })}
          </span>
          <button
            className="hidden rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive group-hover:inline-flex"
            onClick={() => onDelete(notification)}
            aria-label="Delete notification"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const notificationsQuery = useNotifications(toApiFilter(filter));
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = useMemo(() => notificationsQuery.data ?? [], [notificationsQuery.data]);
  const visible = useMemo(() => notifications.slice(0, visibleCount), [notifications, visibleCount]);
  const hasMore = visible.length < notifications.length;

  const openNotification = async (n: NotificationDTO) => {
    if (!n.isRead) {
      await markAsRead.mutateAsync(n.id);
    }

    const next = destination(n);
    if (next.hash) {
      window.location.assign(`${next.to}#${next.hash}`);
      return;
    }
    window.location.assign(next.to);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Keep track of booking, ticket, and system updates.</p>
        </div>
        <Button variant="outline" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
          Mark all as read
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'bookings', label: 'Bookings' },
          { key: 'tickets', label: 'Tickets' },
          { key: 'comments', label: 'Comments' },
        ] as { key: Filter; label: string }[]).map((tab) => (
          <Button
            key={tab.key}
            variant={tab.key === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter(tab.key);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity</span>
            <Badge variant="secondary">{notifications.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notificationsQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : visible.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-sm font-medium text-foreground">No notifications here</p>
              <p className="mt-1 text-xs text-muted-foreground">{deriveFilterMessage(filter)}</p>
            </div>
          ) : (
            <>
              {visible.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onOpen={openNotification}
                  onDelete={(item) => deleteNotification.mutate(item.id)}
                />
              ))}
              {hasMore && (
                <>
                  <Separator />
                  <div className="flex justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                      Load more
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
