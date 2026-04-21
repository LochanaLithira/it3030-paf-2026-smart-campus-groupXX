import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useResourceHeatmap, useResources } from '@/hooks/useResources';
import type { DayOfWeek, ResourceHeatmapPeriod, ResourceType } from '@/types/api';

interface ResourceHeatmapProps {
  resourceId?: string;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const PERIOD_OPTIONS: Array<{ value: ResourceHeatmapPeriod; label: string }> = [
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
];

const TYPE_ORDER: ResourceType[] = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
};

export function ResourceHeatmap({ resourceId }: ResourceHeatmapProps) {
  const [selectedResourceId, setSelectedResourceId] = useState(resourceId ?? '');
  const [period, setPeriod] = useState<ResourceHeatmapPeriod>('this_week');

  const resourcesQuery = useResources({ page: 0, size: 1000, sort: 'name,asc' });
  const resources = useMemo(() => resourcesQuery.data?.content ?? [], [resourcesQuery.data]);

  useEffect(() => {
    if (resourceId) {
      setSelectedResourceId(resourceId);
    }
  }, [resourceId]);

  useEffect(() => {
    if (resources.length === 0) {
      if (selectedResourceId) {
        setSelectedResourceId('');
      }
      return;
    }

    const exists = resources.some((resource) => resource.resourceId === selectedResourceId);
    if (!exists) {
      setSelectedResourceId(resources[0].resourceId);
    }
  }, [resources, selectedResourceId]);

  const groupedResources = useMemo(() => {
    const byType = new Map<ResourceType, typeof resources>();
    for (const type of TYPE_ORDER) {
      byType.set(type, []);
    }

    for (const resource of resources) {
      const list = byType.get(resource.type) ?? [];
      list.push(resource);
      byType.set(resource.type, list);
    }

    for (const [type, list] of byType.entries()) {
      byType.set(
        type,
        [...list].sort((a, b) => a.name.localeCompare(b.name))
      );
    }

    return byType;
  }, [resources]);

  const heatmapQuery = useResourceHeatmap(selectedResourceId || null, { period });
  const heatmap = heatmapQuery.data;
  const showSkeleton = heatmapQuery.isFetching;

  const allNonNullZero = useMemo(() => {
    if (!heatmap) return false;
    const values = heatmap.heatmap.flatMap((row) => DAYS.map((day) => row.days[day])).filter((value) => value !== null);
    return values.length > 0 && values.every((value) => value === 0);
  }, [heatmap]);

  const availabilityNotConfigured = Boolean(heatmap && heatmap.availabilityWindows.length === 0);

  const warning = useMemo(() => {
    if (!heatmap) return null;
    if (heatmap.resourceStatus === 'OUT_OF_SERVICE') {
      return {
        title: 'Resource is out of service',
        description: 'This resource is currently marked as out of service. Utilization reflects historical approved bookings.',
        className: 'border-red-500/50 bg-red-50 dark:bg-red-950/25',
        titleClassName: 'text-red-800 dark:text-red-300',
        descriptionClassName: 'text-red-700 dark:text-red-400',
      };
    }
    if (heatmap.resourceStatus === 'UNDER_MAINTENANCE') {
      return {
        title: 'Resource is under maintenance',
        description: 'This resource is currently under maintenance. Utilization reflects historical approved bookings.',
        className: 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/25',
        titleClassName: 'text-amber-800 dark:text-amber-300',
        descriptionClassName: 'text-amber-700 dark:text-amber-400',
      };
    }
    return null;
  }, [heatmap]);

  const peakSlotLabel = useMemo(() => {
    if (!heatmap?.summary.peakSlot) {
      return 'N/A';
    }

    const peak = heatmap.summary.peakSlot;
    return `${DAY_LABELS[peak.day]} ${formatHourRange(peak.hourSlot)} (${peak.utilizationPct}%)`;
  }, [heatmap]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilization Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Resource</p>
            <Select
              value={selectedResourceId || '__none__'}
              onValueChange={(value) => setSelectedResourceId(!value || value === '__none__' ? '' : value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" disabled>
                  Select resource
                </SelectItem>
                {TYPE_ORDER.map((type) => {
                  const list = groupedResources.get(type) ?? [];
                  if (list.length === 0) {
                    return null;
                  }
                  return (
                    <SelectGroup key={type}>
                      <SelectLabel>{type}</SelectLabel>
                      {list.map((resource) => (
                        <SelectItem key={resource.resourceId} value={resource.resourceId}>
                          {resource.name} ({resource.status})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Period</p>
            <Select
              value={period}
              onValueChange={(value) => {
                if (!value) return;
                setPeriod(value as ResourceHeatmapPeriod);
              }}
            >
              <SelectTrigger className="w-full md:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm">Peak Slot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium">{peakSlotLabel}</CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm">Avg Utilization</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium">
              {heatmap ? `${heatmap.summary.avgUtilizationPct}%` : 'N/A'}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm">Idle Slots</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium">{heatmap ? heatmap.summary.idleSlots : 'N/A'}</CardContent>
          </Card>
        </div>

        {warning && (
          <Alert className={warning.className}>
            <AlertTitle className={warning.titleClassName}>{warning.title}</AlertTitle>
            <AlertDescription className={warning.descriptionClassName}>{warning.description}</AlertDescription>
          </Alert>
        )}

        {allNonNullZero && (
          <Alert>
            <AlertTitle>No approved bookings in this period</AlertTitle>
            <AlertDescription>
              The heatmap is rendered, but all configured slots are currently at 0% utilization.
            </AlertDescription>
          </Alert>
        )}

        {availabilityNotConfigured && (
          <Alert>
            <AlertTitle>No availability windows configured for this resource</AlertTitle>
            <AlertDescription>
              All cells are treated as available in the 08:00–20:00 range until windows are configured.
            </AlertDescription>
          </Alert>
        )}

        {!selectedResourceId && (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Select a resource to view utilization.
          </div>
        )}

        {selectedResourceId && (
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {showSkeleton ? (
                <HeatmapSkeleton />
              ) : heatmap ? (
                <HeatmapGrid
                  resourceName={heatmap.resourceName}
                  rows={heatmap.heatmap}
                />
              ) : (
                <div className="rounded-md border p-4 text-sm text-muted-foreground">
                  Unable to load heatmap data.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HeatmapGrid({
  resourceName,
  rows,
}: {
  resourceName: string;
  rows: Array<{
    hourSlot: string;
    days: Record<DayOfWeek, number | null>;
    bookingCounts: Record<DayOfWeek, number | null>;
  }>;
}) {
  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: '72px repeat(7, minmax(56px, 1fr))',
      }}
    >
      <div className="text-xs text-muted-foreground" />
      {DAYS.map((day) => (
        <div key={`head-${day}`} className="text-center text-xs font-medium text-muted-foreground">
          {day}
        </div>
      ))}

      {rows.map((row) => (
        <Fragment key={`row-${row.hourSlot}`}>
          <div key={`hour-${row.hourSlot}`} className="flex items-center text-xs text-muted-foreground">
            {row.hourSlot}
          </div>
          {DAYS.map((day) => {
            const value = row.days[day];
            const bookingCount = row.bookingCounts[day] ?? 0;

            if (value === null) {
              return <div key={`${row.hourSlot}-${day}`} className="heatmap-cell-null h-10 rounded border" />;
            }

            const token = getCellToken(value);
            return (
              <Tooltip key={`${row.hourSlot}-${day}`}>
                <TooltipTrigger
                  className="h-10 rounded border text-xs font-semibold transition-colors"
                  style={{
                    backgroundColor: `var(${token.bg})`,
                    color: `var(${token.fg})`,
                  }}
                >
                  {value > 0 ? `${value}%` : ''}
                </TooltipTrigger>
                <TooltipContent className="max-w-none">
                  <div className="space-y-0.5">
                    <p className="font-medium">{resourceName}</p>
                    <p>{DAY_LABELS[day]}</p>
                    <p>{formatHourRange(row.hourSlot)}</p>
                    <p>Utilization: {value}%</p>
                    <p>Bookings: {bookingCount}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function HeatmapSkeleton() {
  const hours = Array.from({ length: 13 }, (_, index) => `${String(index + 8).padStart(2, '0')}:00`);

  return (
    <div
      className="grid gap-1"
      style={{
        gridTemplateColumns: '72px repeat(7, minmax(56px, 1fr))',
      }}
    >
      <div className="h-4" />
      {DAYS.map((day) => (
        <div key={`sk-head-${day}`} className="h-4 rounded bg-muted/70" />
      ))}

      {hours.map((hour) => (
        <Fragment key={`sk-row-${hour}`}>
          <div key={`sk-hour-${hour}`} className="h-10 rounded bg-muted/50" />
          {DAYS.map((day) => (
            <div key={`sk-${hour}-${day}`} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function getCellToken(value: number): { bg: string; fg: string } {
  if (value <= 0) {
    return { bg: '--heatmap-0-bg', fg: '--heatmap-0-fg' };
  }
  if (value <= 20) {
    return { bg: '--heatmap-1-20-bg', fg: '--heatmap-1-20-fg' };
  }
  if (value <= 40) {
    return { bg: '--heatmap-21-40-bg', fg: '--heatmap-21-40-fg' };
  }
  if (value <= 60) {
    return { bg: '--heatmap-41-60-bg', fg: '--heatmap-41-60-fg' };
  }
  if (value <= 80) {
    return { bg: '--heatmap-61-80-bg', fg: '--heatmap-61-80-fg' };
  }
  return { bg: '--heatmap-81-100-bg', fg: '--heatmap-81-100-fg' };
}

function formatHourRange(hourSlot: string): string {
  const hour = Number(hourSlot.slice(0, 2));
  const endHour = (hour + 1) % 24;
  return `${hourSlot}-${String(endHour).padStart(2, '0')}:00`;
}
