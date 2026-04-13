import { useMemo, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useResources } from '@/hooks/useResources';
import { useCreateBooking } from '@/hooks/useBookings';
import type { BookingCreateRequest, ResourceResponse } from '@/types/api';

export function BookingCreatePage() {
  const search = useSearch({ strict: false }) as { resourceId?: string };
  const [resourceId, setResourceId] = useState<string>(search?.resourceId ?? '');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState<number>(1);

  const { data } = useResources({ page: 0, size: 50, status: 'ACTIVE' });
  const create = useCreateBooking();

  const resources = useMemo(() => data?.content ?? [], [data]);

  const selected: ResourceResponse | null = useMemo(
    () => resources.find((r: ResourceResponse) => r.resourceId === resourceId) ?? null,
    [resources, resourceId]
  );

  const canSubmit =
    Boolean(resourceId) &&
    Boolean(bookingDate) &&
    Boolean(startTime) &&
    Boolean(endTime) &&
    purpose.trim().length > 0 &&
    expectedAttendees > 0;

  async function onSubmit() {
    const body: BookingCreateRequest = {
      resourceId,
      bookingDate,
      startTime,
      endTime,
      purpose,
      expectedAttendees,
    };
    create.mutate(body);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Booking</h1>
        <p className="text-muted-foreground">Request a resource booking (starts as PENDING).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Resource</Label>
            <Select
              value={resourceId || '__none__'}
              onValueChange={(v) => setResourceId(v && v !== '__none__' ? v : '')}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select...</SelectItem>
                {resources.map((r: ResourceResponse) => (
                  <SelectItem key={r.resourceId} value={r.resourceId}>
                    {r.name} ({r.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected?.capacity ? (
              <p className="text-sm text-muted-foreground">Capacity: {selected.capacity}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Capacity: —</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Expected attendees</Label>
            <Input
              type="number"
              min={1}
              value={expectedAttendees}
              onChange={(e) => setExpectedAttendees(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Start time</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>End time</Label>
            <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Purpose</Label>
            <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. PHY201 practical session" />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button onClick={onSubmit} disabled={!canSubmit || create.isPending}>
              Submit request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

