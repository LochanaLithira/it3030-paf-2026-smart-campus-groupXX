import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Timer, CheckCircle, AlertCircle } from 'lucide-react';
import type { TicketResponse, TicketPriority } from '@/types/api';
import { formatDistanceToNowStrict } from 'date-fns';

interface SLATimerCardProps {
  ticket: TicketResponse;
}

// SLA Thresholds in seconds
const SLA_THRESHOLDS: Record<TicketPriority, { ttfr: number; ttr: number }> = {
  CRITICAL: { ttfr: 3600, ttr: 14400 }, // 1h, 4h
  HIGH: { ttfr: 14400, ttr: 86400 }, // 4h, 24h
  MEDIUM: { ttfr: 28800, ttr: 172800 }, // 8h, 48h
  LOW: { ttfr: 86400, ttr: 259200 }, // 24h, 72h
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

function getSlaStatusVariant(
  elapsedSeconds: number,
  targetSeconds: number,
  completed: boolean
): { variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; label: string } {
  if (elapsedSeconds <= targetSeconds) {
    if (completed) {
      return { variant: 'default', color: 'bg-green-100 text-green-800 hover:bg-green-100', label: 'Met' };
    }
    return { variant: 'secondary', color: 'bg-amber-100 text-amber-800 hover:bg-amber-100', label: 'On Track' };
  }
  return { variant: 'destructive', color: 'bg-red-100 text-red-800 hover:bg-red-100', label: 'Breached' };
}

export function SLATimerCard({ ticket }: SLATimerCardProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Only set up the timer if we actually have running SLAs
    const isTtfrRunning = ticket.timeToFirstResponseSeconds === null && ticket.status === 'OPEN';
    const isTtrRunning = ticket.timeToResolutionSeconds === null && ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.status !== 'REJECTED';

    if (!isTtfrRunning && !isTtrRunning) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket.status, ticket.timeToFirstResponseSeconds, ticket.timeToResolutionSeconds]);

  const thresholds = SLA_THRESHOLDS[ticket.priority] || SLA_THRESHOLDS.LOW;

  const createdAtDate = new Date(ticket.createdAt);
  const liveElapsedSeconds = Math.floor((now.getTime() - createdAtDate.getTime()) / 1000);

  // Time to First Response
  const ttfrCompleted = ticket.timeToFirstResponseSeconds !== null;
  const ttfrSeconds = ttfrCompleted ? ticket.timeToFirstResponseSeconds! : liveElapsedSeconds;
  // If the ticket was rejected/closed while OPEN, TTFR shouldn't keep running. We freeze it.
  const isTtfrLive = !ttfrCompleted && ticket.status === 'OPEN';
  const displayTtfrSeconds = !isTtfrLive && !ttfrCompleted ? null : ttfrSeconds;

  const ttfrStatus = displayTtfrSeconds !== null 
    ? getSlaStatusVariant(displayTtfrSeconds, thresholds.ttfr, ttfrCompleted)
    : null;

  // Time to Resolution
  const ttrCompleted = ticket.timeToResolutionSeconds !== null;
  const ttrSeconds = ttrCompleted ? ticket.timeToResolutionSeconds! : liveElapsedSeconds;
  // If the ticket was rejected/closed, TTR shouldn't keep running unless it was actually resolved
  const isTtrLive = !ttrCompleted && (ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS');
  const displayTtrSeconds = !isTtrLive && !ttrCompleted ? null : ttrSeconds;

  const ttrStatus = displayTtrSeconds !== null
    ? getSlaStatusVariant(displayTtrSeconds, thresholds.ttr, ttrCompleted)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5" />
          Response Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time to First Response */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-500">Reply</span>
            {ttfrStatus && (
              <Badge variant={ttfrStatus.variant} className={`border-transparent ${ttfrStatus.color}`}>
                {ttfrStatus.label}
              </Badge>
            )}
          </div>
          {displayTtfrSeconds !== null ? (
            <div className="flex items-center gap-2">
              {ttfrCompleted ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-amber-600 animate-pulse" />}
              <span className={`text-xl font-semibold ${ttfrStatus?.variant === 'destructive' ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDuration(displayTtfrSeconds)}
              </span>
              <span className="text-xs text-gray-400">/ {formatDuration(thresholds.ttfr)}</span>
            </div>
          ) : (
            <span className="text-sm italic text-gray-400">N/A</span>
          )}
        </div>

        {/* Time to Resolution */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-500">Fixed</span>
            {ttrStatus && (
              <Badge variant={ttrStatus.variant} className={`border-transparent ${ttrStatus.color}`}>
                {ttrStatus.label}
              </Badge>
            )}
          </div>
          {displayTtrSeconds !== null ? (
            <div className="flex items-center gap-2">
              {ttrCompleted ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Clock className="h-4 w-4 text-amber-600 animate-pulse" />}
              <span className={`text-xl font-semibold ${ttrStatus?.variant === 'destructive' ? 'text-red-600' : 'text-gray-900'}`}>
                {formatDuration(displayTtrSeconds)}
              </span>
              <span className="text-xs text-gray-400">/ {formatDuration(thresholds.ttr)}</span>
            </div>
          ) : (
            <span className="text-sm italic text-gray-400">N/A</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
