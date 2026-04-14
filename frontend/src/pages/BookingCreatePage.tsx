import { useEffect, useMemo, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocations } from '@/hooks/useLocations';
import { useResources } from '@/hooks/useResources';
import { useCreateBooking } from '@/hooks/useBookings';
import type { BookingCreateRequest, LocationResponse, ResourceResponse, ResourceType } from '@/types/api';

const RESOURCE_TYPE_OPTIONS: ResourceType[] = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];

export function BookingCreatePage() {
  const search = useSearch({ strict: false }) as { resourceId?: string };
  const [resourceId, setResourceId] = useState<string>(search?.resourceId ?? '');
  const [locationId, setLocationId] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | ''>('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedAttendees, setExpectedAttendees] = useState<number>(1);

  const { data, isLoading: resourcesLoading } = useResources({
    page: 0,
    size: 1000,
    status: 'ACTIVE',
    type: resourceTypeFilter || undefined,
  });
  const { data: locationsData, isLoading: locationsLoading } = useLocations();
  const create = useCreateBooking();

  const resources = useMemo(() => data?.content ?? [], [data]);
  const locations = useMemo(
    () =>
      (locationsData ?? []).filter((location) => {
        if (location.status !== 'ACTIVE') {
          return false;
        }
        if (!resourceTypeFilter) {
          return true;
        }
        return location.type === resourceTypeFilter;
      }),
    [locationsData, resourceTypeFilter]
  );
  const assetsLoading = resourcesLoading || locationsLoading;

  useEffect(() => {
    if (resourceId && !resources.some((resource) => resource.resourceId === resourceId)) {
      setResourceId('');
    }
  }, [resourceId, resources]);

  useEffect(() => {
    if (locationId && !locations.some((location) => location.locationId === locationId)) {
      setLocationId('');
    }
  }, [locationId, locations]);

  const selectedResource: ResourceResponse | null = useMemo(
    () => resources.find((r: ResourceResponse) => r.resourceId === resourceId) ?? null,
    [resources, resourceId]
  );
  const selectedLocation: LocationResponse | null = useMemo(
    () => locations.find((location) => location.locationId === locationId) ?? null,
    [locations, locationId]
  );

  const selectedType = selectedResource?.type ?? selectedLocation?.type ?? null;

  const canSubmit =
    (Boolean(resourceId) || Boolean(locationId)) &&
    Boolean(bookingDate) &&
    Boolean(startTime) &&
    Boolean(endTime) &&
    purpose.trim().length > 0 &&
    expectedAttendees > 0;

  async function onSubmit() {
    const body: BookingCreateRequest = {
      resourceId: resourceId || undefined,
      locationId: locationId || undefined,
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
        <p className="text-muted-foreground">Request a resource or location booking (starts as PENDING).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking request</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Filter by resource type</Label>
            <Select
              value={resourceTypeFilter || '__all__'}
              onValueChange={(value) => setResourceTypeFilter(value === '__all__' ? '' : (value as ResourceType))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All resource types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All resource types</SelectItem>
                {RESOURCE_TYPE_OPTIONS.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Resource or Location</Label>
            <Select
              value={resourceId || (locationId ? `__location_${locationId}` : '__none__')}
              onValueChange={(v) => {
                if (!v || v === '__none__') {
                  setResourceId('');
                  setLocationId('');
                  return;
                }
                if (v.startsWith('__location_')) {
                  setLocationId(v.replace('__location_', ''));
                  setResourceId('');
                  return;
                }
                setResourceId(v);
                setLocationId('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Select...</SelectItem>
                {assetsLoading && (
                  <SelectItem value="__loading__" disabled>
                    Loading resources and locations...
                  </SelectItem>
                )}
                {!assetsLoading && resources.length === 0 && locations.length === 0 && (
                  <SelectItem value="__empty__" disabled>
                    No active resources or locations found
                  </SelectItem>
                )}
                {resources.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>Resources</SelectLabel>
                    {resources.map((r: ResourceResponse) => (
                      <SelectItem key={r.resourceId} value={r.resourceId}>
                        {r.name} ({r.type})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {locations.length > 0 && (
                  <>
                    <SelectSeparator />
                    <SelectGroup>
                      <SelectLabel>Locations</SelectLabel>
                      {locations.map((location: LocationResponse) => (
                        <SelectItem
                          key={location.locationId}
                          value={`__location_${location.locationId}`}
                        >
                          {location.buildingName} - Floor {location.floorNumber}
                          {location.roomNumber ? `, Room ${location.roomNumber}` : ''} ({location.type})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                Selected type: {selectedType ?? '—'}
            </p>
            <p className="text-sm text-muted-foreground">Matching locations: {locations.length}</p>
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

