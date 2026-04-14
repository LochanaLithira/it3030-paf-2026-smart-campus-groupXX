import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Bell, MessageCircle, Ticket, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  notificationKeys,
  toPreferenceMap,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from '@/hooks/useNotifications';
import type { NotificationCategory } from '@/types/api';

interface RowConfig {
  category: NotificationCategory;
  label: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}

const ROWS: RowConfig[] = [
  {
    category: 'BOOKING',
    label: 'Booking Notifications',
    description: 'Receive alerts for booking approvals, rejections, and cancellations',
    icon: Bell,
    iconColor: '#2E75B6',
  },
  {
    category: 'TICKET',
    label: 'Ticket Notifications',
    description: 'Receive alerts when your ticket status changes, is assigned, or resolved',
    icon: Ticket,
    iconColor: '#7030A0',
  },
  {
    category: 'COMMENT',
    label: 'Comment Notifications',
    description: 'Receive alerts when new comments are added to your tickets',
    icon: MessageCircle,
    iconColor: '#1F7A8C',
  },
  {
    category: 'SYSTEM',
    label: 'System Notifications',
    description: 'Receive general system announcements and updates',
    icon: Megaphone,
    iconColor: '#333333',
  },
];

export function NotificationPreferencesSection() {
  const queryClient = useQueryClient();
  const preferencesQuery = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const [savedCategory, setSavedCategory] = useState<NotificationCategory | null>(null);

  const currentPrefs = useMemo(() => {
    return toPreferenceMap(preferencesQuery.data ?? []);
  }, [preferencesQuery.data]);

  const onToggle = async (category: NotificationCategory, value: boolean) => {
    const previousList = preferencesQuery.data ?? [];

    const optimistic = previousList.map((item) =>
      item.category === category ? { ...item, enabled: value } : item
    );
    queryClient.setQueryData(notificationKeys.preferences(), optimistic);

    try {
      await updatePreferences.mutateAsync([{ category, enabled: value }]);
      setSavedCategory(category);
      setTimeout(() => setSavedCategory((c) => (c === category ? null : c)), 2000);
    } catch {
      toast.error('Could not save preference. Please try again.');
      queryClient.setQueryData(notificationKeys.preferences(), previousList);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose which categories should create new in-app notifications.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ROWS.map((row, idx) => {
          const Icon = row.icon;
          const checked = currentPrefs[row.category];
          return (
            <div key={row.category}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4" style={{ color: row.iconColor }} />
                  <div>
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                    {savedCategory === row.category && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="h-3 w-3" /> Saved
                      </p>
                    )}
                  </div>
                </div>

                <Switch
                  checked={checked}
                  onCheckedChange={(next) => onToggle(row.category, Boolean(next))}
                  disabled={updatePreferences.isPending || preferencesQuery.isLoading}
                />
              </div>
              {idx < ROWS.length - 1 ? <Separator className="mt-4" /> : null}
            </div>
          );
        })}

        <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          Disabling a category stops new notifications from being saved. Existing notifications in your panel are not removed.
        </div>
      </CardContent>
    </Card>
  );
}
