import { format } from 'date-fns';
import { CheckCircle, Clock, AlertCircle, Ban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { StatusHistoryResponse, TicketStatus } from '@/types/api';

interface StatusTimelineProps {
  history: StatusHistoryResponse[];
}

const STATUS_CONFIG: Record<
  TicketStatus,
  { icon: typeof CheckCircle; color: string; bgColor: string }
> = {
  OPEN: {
    icon: AlertCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  IN_PROGRESS: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  RESOLVED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  CLOSED: {
    icon: CheckCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  REJECTED: {
    icon: Ban,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

export function StatusTimeline({ history }: StatusTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="mx-auto h-12 w-12 opacity-20 mb-2" />
        <p>No status history available</p>
      </div>
    );
  }

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedHistory.map((entry, index) => {
        const config = STATUS_CONFIG[entry.newStatus];
        const Icon = config.icon;
        const isLatest = index === 0;

        return (
          <div key={entry.historyId} className="relative">
            {/* Timeline Line */}
            {index < sortedHistory.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
            )}

            {/* Timeline Item */}
            <div className="flex gap-4">
              {/* Icon */}
              <div
                className={`
                  flex h-12 w-12 shrink-0 items-center justify-center rounded-full
                  ${config.bgColor} ${isLatest ? 'ring-4 ring-white shadow-lg' : ''}
                `}
              >
                <Icon className={`h-6 w-6 ${config.color}`} />
              </div>

              {/* Content */}
              <Card className={`flex-1 ${isLatest ? 'border-2 border-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Status Change */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">
                          {entry.newStatus.replace('_', ' ')}
                        </span>
                        {isLatest && (
                          <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                            Current
                          </span>
                        )}
                      </div>

                      {/* Changed By */}
                      <p className="text-sm text-muted-foreground">
                        Changed by{' '}
                        <span className="font-medium text-foreground">
                          {entry.changedBy.fullName}
                        </span>
                      </p>

                      {/* Timestamp */}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(entry.changedAt), 'PPpp')}
                      </p>

                      {/* Notes */}
                      {entry.notes && (
                        <div className="mt-3 rounded-md bg-muted p-3">
                          <p className="text-sm font-medium mb-1">Notes:</p>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      })}
    </div>
  );
}
