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
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Calendar, Info } from 'lucide-react';
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
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Peak Slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-green-700 dark:text-green-400">{peakSlotLabel}</p>
              <p className="text-xs text-muted-foreground">Highest utilization</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Avg Utilization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                {heatmap ? `${heatmap.summary.avgUtilizationPct}%` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">Across all slots</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                Idle Slots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-400">
                {heatmap ? heatmap.summary.idleSlots : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground">Available time slots</p>
            </CardContent>
          </Card>
        </div>

        {/* Color Legend */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Utilization Legend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'var(--heatmap-0-bg)' }} />
                <span className="text-xs">0%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'var(--heatmap-1-20-bg)' }} />
                <span className="text-xs">1-20%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'var(--heatmap-21-40-bg)' }} />
                <span className="text-xs">21-40%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'var(--heatmap-41-60-bg)' }} />
                <span className="text-xs">41-60%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'var(--heatmap-61-80-bg)' }} />
                <span className="text-xs">61-80%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: 'var(--heatmap-81-100-bg)' }} />
                <span className="text-xs">81-100%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Higher percentages indicate more bookings relative to available slots
            </p>
          </CardContent>
        </Card>

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
          <Card className="shadow-sm">
            <CardContent className="py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Select a resource to view utilization heatmap</p>
            </CardContent>
          </Card>
        )}

        {selectedResourceId && (
          <div className="overflow-x-auto">
            <div className="min-w-[520px] max-w-full">
              {showSkeleton ? (
                <HeatmapSkeleton />
              ) : heatmap ? (
                <HeatmapGrid
                  resourceName={heatmap.resourceName}
                  rows={heatmap.heatmap}
                />
              ) : (
                <Card className="shadow-sm">
                  <CardContent className="py-8 text-center">
                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Unable to load heatmap data.</p>
                  </CardContent>
                </Card>
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
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{resourceName}</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Day</p>
                        <p className="font-medium">{DAY_LABELS[day]}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Slot</p>
                        <p className="font-medium">{formatHourRange(row.hourSlot)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Utilization</p>
                        <p className="font-medium">{value}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Bookings</p>
                        <p className="font-medium">{bookingCount}</p>
                      </div>
                    </div>
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
