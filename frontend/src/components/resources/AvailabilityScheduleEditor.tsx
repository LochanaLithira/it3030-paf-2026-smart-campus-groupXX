import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DayOfWeek, ResourceAvailabilityRequest } from '@/types/api';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function sliceTime(t: string): string {
  if (!t) return '';
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function normalizeTime(t: string): string {
  if (!t) return '';
  return t.length === 5 ? `${t}:00` : t;
}

function compareTime(a: string, b: string): number {
  return normalizeTime(a).localeCompare(normalizeTime(b));
}

export type ScheduleMode = 'day' | 'week' | 'month';

interface AvailabilityScheduleEditorProps {
  value: ResourceAvailabilityRequest[];
  onChange: (next: ResourceAvailabilityRequest[]) => void;
  disabled?: boolean;
}

export function AvailabilityScheduleEditor({
  value,
  onChange,
  disabled,
}: AvailabilityScheduleEditorProps) {
  const [mode, setMode] = useState<ScheduleMode>('day');

  const first = value[0];
  const [dayDay, setDayDay] = useState<DayOfWeek>(first?.dayOfWeek ?? 'MON');
  const [dayStart, setDayStart] = useState(() => sliceTime(first?.startTime ?? ''));
  const [dayEnd, setDayEnd] = useState(() => sliceTime(first?.endTime ?? ''));

  const [weekPick, setWeekPick] = useState<Set<DayOfWeek>>(() => {
    if (value.length <= 1) return new Set();
    const same =
      value.length > 1 &&
      value.every(
        (v) =>
          normalizeTime(v.startTime) === normalizeTime(value[0].startTime) &&
          normalizeTime(v.endTime) === normalizeTime(value[0].endTime),
      );
    if (same) return new Set(value.map((v) => v.dayOfWeek));
    return new Set();
  });
  const [weekStart, setWeekStart] = useState(() =>
    value.length > 1 ? sliceTime(value[0]?.startTime ?? '') : '',
  );
  const [weekEnd, setWeekEnd] = useState(() =>
    value.length > 1 ? sliceTime(value[0]?.endTime ?? '') : '',
  );

  const [monthRows, setMonthRows] = useState(() =>
    value.length
      ? value.map((v, i) => ({
          id: `r${i}`,
          dayOfWeek: v.dayOfWeek,
          start: sliceTime(v.startTime),
          end: sliceTime(v.endTime),
        }))
      : [{ id: 'r0', dayOfWeek: 'MON' as DayOfWeek, start: '', end: '' }],
  );

  const emitDay = (nextDay: DayOfWeek, start: string, end: string) => {
    if (!start || !end || compareTime(end, start) <= 0) {
      onChange([]);
      return;
    }
    onChange([
      {
        dayOfWeek: nextDay,
        startTime: normalizeTime(start),
        endTime: normalizeTime(end),
      },
    ]);
  };

  const emitWeek = (days: Set<DayOfWeek>, start: string, end: string) => {
    if (!start || !end || days.size === 0 || compareTime(end, start) <= 0) {
      onChange([]);
      return;
    }
    onChange(
      Array.from(days)
        .sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
        .map((d) => ({
          dayOfWeek: d,
          startTime: normalizeTime(start),
          endTime: normalizeTime(end),
        })),
    );
  };

  const emitMonth = (
    rows: { id: string; dayOfWeek: DayOfWeek; start: string; end: string }[],
  ) => {
    const next: ResourceAvailabilityRequest[] = [];
    for (const r of rows) {
      if (!r.start || !r.end || compareTime(r.end, r.start) <= 0) continue;
      next.push({
        dayOfWeek: r.dayOfWeek,
        startTime: normalizeTime(r.start),
        endTime: normalizeTime(r.end),
      });
    }
    onChange(next);
  };

  const toggleWeekDay = (d: DayOfWeek, checked: boolean) => {
    setWeekPick((prev) => {
      const n = new Set(prev);
      if (checked) n.add(d);
      else n.delete(d);
      emitWeek(n, weekStart, weekEnd);
      return n;
    });
  };

  const addMonthRow = () => {
    setMonthRows((r) => {
      const next = [...r, { id: crypto.randomUUID(), dayOfWeek: 'MON' as DayOfWeek, start: '', end: '' }];
      emitMonth(next);
      return next;
    });
  };

  const removeMonthRow = (id: string) => {
    setMonthRows((r) => {
      if (r.length <= 1) return r;
      const next = r.filter((row) => row.id !== id);
      emitMonth(next);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === 'day' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => setMode('day')}
        >
          Day
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'week' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => setMode('week')}
        >
          Week
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'month' ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => setMode('month')}
        >
          Month
        </Button>
      </div>

      {mode === 'day' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Day</Label>
            <Select
              value={dayDay}
              onValueChange={(v) => {
                const d = v as DayOfWeek;
                setDayDay(d);
                emitDay(d, dayStart, dayEnd);
              }}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Start</Label>
            <Input
              type="time"
              value={dayStart}
              onChange={(e) => {
                const v = e.target.value;
                setDayStart(v);
                emitDay(dayDay, v, dayEnd);
              }}
              disabled={disabled}
            />
          </div>
          <div className="space-y-1.5">
            <Label>End</Label>
            <Input
              type="time"
              value={dayEnd}
              onChange={(e) => {
                const v = e.target.value;
                setDayEnd(v);
                emitDay(dayDay, dayStart, v);
              }}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {mode === 'week' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {DAYS.map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={weekPick.has(d)}
                  disabled={disabled}
                  onCheckedChange={(c) => toggleWeekDay(d, Boolean(c))}
                />
                {d}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input
                type="time"
                value={weekStart}
                onChange={(e) => {
                  const v = e.target.value;
                  setWeekStart(v);
                  emitWeek(weekPick, v, weekEnd);
                }}
                disabled={disabled}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input
                type="time"
                value={weekEnd}
                onChange={(e) => {
                  const v = e.target.value;
                  setWeekEnd(v);
                  emitWeek(weekPick, weekStart, v);
                }}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}

      {mode === 'month' && (
        <div className="space-y-3">
          {monthRows.map((row, idx) => (
            <div
              key={row.id}
              className="grid grid-cols-1 gap-2 border-b border-border pb-3 last:border-0 md:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Select
                  value={row.dayOfWeek}
                  onValueChange={(v) => {
                    const nw = v as DayOfWeek;
                    setMonthRows((r) => {
                      const next = r.map((x) => (x.id === row.id ? { ...x, dayOfWeek: nw } : x));
                      emitMonth(next);
                      return next;
                    });
                  }}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={row.start}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMonthRows((r) => {
                      const next = r.map((x) => (x.id === row.id ? { ...x, start: v } : x));
                      emitMonth(next);
                      return next;
                    });
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input
                  type="time"
                  value={row.end}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMonthRows((r) => {
                      const next = r.map((x) => (x.id === row.id ? { ...x, end: v } : x));
                      emitMonth(next);
                      return next;
                    });
                  }}
                  disabled={disabled}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-end"
                disabled={disabled || monthRows.length <= 1}
                onClick={() => removeMonthRow(row.id)}
              >
                Remove
              </Button>
              {idx === monthRows.length - 1 && (
                <div className="col-span-full">
                  <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={addMonthRow}>
                    Add row
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
