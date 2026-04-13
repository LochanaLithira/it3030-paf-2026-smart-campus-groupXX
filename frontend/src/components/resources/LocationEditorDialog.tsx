import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AvailabilityScheduleEditor } from '@/components/resources/AvailabilityScheduleEditor';
import { useCreateLocation, useUpdateLocation } from '@/hooks/useLocations';
import { useResourceTags } from '@/hooks/useResources';
import type { LocationResponse, ResourceAvailabilityRequest } from '@/types/api';

const schema = z.object({
  buildingName: z.string().min(1, 'Building name is required').max(100),
  floorNumber: z.number()
    .int('Floor number must be an integer')
    .min(-10, 'Floor number cannot be less than -10')
    .max(300, 'Floor number cannot be greater than 300'),
  roomNumber: z.string().max(20).optional().or(z.literal('')),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  type: z.enum(['LECTURE_HALL', 'LAB', 'MEETING_ROOM']),
  status: z.enum(['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE']),
  tagIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

interface LocationEditorDialogProps {
  open: boolean;
  onClose: () => void;
  location?: LocationResponse | null;
}

function mapAvailabilityFromApi(rows: LocationResponse['availability']): ResourceAvailabilityRequest[] {
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    startTime: r.startTime.length === 5 ? `${r.startTime}:00` : r.startTime,
    endTime: r.endTime.length === 5 ? `${r.endTime}:00` : r.endTime,
  }));
}

export function LocationEditorDialog({ open, onClose, location }: LocationEditorDialogProps) {
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const { data: tags = [] } = useResourceTags();
  const isEdit = Boolean(location);

  const [availability, setAvailability] = useState<ResourceAvailabilityRequest[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      buildingName: '',
      floorNumber: 0,
      roomNumber: '',
      capacity: 1,
      type: 'LECTURE_HALL',
      status: 'ACTIVE',
      tagIds: [],
    },
  });

  const selectedTagIds = watch('tagIds');
  const selectedType = watch('type');
  const selectedStatus = watch('status');

  useEffect(() => {
    if (!open) {
      reset();
      setAvailability([]);
      return;
    }
    if (location) {
      reset({
        buildingName: location.buildingName,
        floorNumber: location.floorNumber,
        roomNumber: location.roomNumber ?? '',
        capacity: location.capacity,
        type: location.type === 'EQUIPMENT' ? 'LECTURE_HALL' : location.type,
        status: location.status,
        tagIds: location.tags.map((t) => t.tagId),
      });
      setAvailability(mapAvailabilityFromApi(location.availability));
    } else {
      reset({
        buildingName: '',
        floorNumber: 0,
        roomNumber: '',
        capacity: 1,
        type: 'LECTURE_HALL',
        status: 'ACTIVE',
        tagIds: [],
      });
      setAvailability([]);
    }
  }, [open, location, reset]);

  const toggleTag = (tagId: string, checked: boolean) => {
    const next = checked
      ? [...selectedTagIds, tagId]
      : selectedTagIds.filter((id) => id !== tagId);
    setValue('tagIds', next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = (values: FormValues) => {
    const payload = {
      buildingName: values.buildingName.trim(),
      floorNumber: values.floorNumber,
      roomNumber: values.roomNumber?.trim() || undefined,
      capacity: values.capacity,
      type: values.type,
      status: values.status,
      tagIds: values.tagIds,
      availability,
    };

    if (!location) {
      createLocation.mutate(payload, { onSuccess: onClose });
      return;
    }
    updateLocation.mutate(
      { locationId: location.locationId, request: payload },
      { onSuccess: onClose },
    );
  };

  const isPending = createLocation.isPending || updateLocation.isPending;
  const editorKey = location?.locationId ?? 'new';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Location' : 'Create Location'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location-building">Building Name</Label>
              <Input id="location-building" {...register('buildingName')} />
              {errors.buildingName && (
                <p className="text-xs text-destructive">{errors.buildingName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-floor">Floor Number</Label>
              <Input id="location-floor" type="number" {...register('floorNumber', { valueAsNumber: true })} />
              {errors.floorNumber && (
                <p className="text-xs text-destructive">{errors.floorNumber.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-room">Room Number</Label>
              <Input id="location-room" {...register('roomNumber')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location-capacity">Capacity</Label>
              <Input id="location-capacity" type="number" {...register('capacity', { valueAsNumber: true })} />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={selectedType}
                onValueChange={(v) => setValue('type', v as FormValues['type'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LECTURE_HALL">Lecture Hall</SelectItem>
                  <SelectItem value="LAB">Lab</SelectItem>
                  <SelectItem value="MEETING_ROOM">Meeting Room</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(v) => setValue('status', v as FormValues['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {tags.map((tag) => (
                <label key={tag.tagId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedTagIds.includes(tag.tagId)}
                    onCheckedChange={(checked) => toggleTag(tag.tagId, Boolean(checked))}
                  />
                  {tag.tagName}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Availability</Label>
            <AvailabilityScheduleEditor
              key={editorKey}
              value={availability}
              onChange={setAvailability}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
