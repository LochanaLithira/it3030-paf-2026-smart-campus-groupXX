import { useEffect } from 'react';
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
import { useCreateResource, useUpdateResource } from '@/hooks/useResources';
import type {
  DayOfWeek,
  LocationResponse,
  ResourceRequest,
  ResourceResponse,
  ResourceTagResponse,
} from '@/types/api';

const schema = z.object({
  name: z.string().min(1, 'Resource name is required').max(150),
  type: z.enum(['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  locationId: z.string().optional(),
  status: z.enum(['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE']),
  description: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url('Image URL must be valid').optional().or(z.literal('')),
  dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
  tagIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

interface ResourceEditorDialogProps {
  open: boolean;
  onClose: () => void;
  resource?: ResourceResponse | null;
  locations: LocationResponse[];
  tags: ResourceTagResponse[];
}

export function ResourceEditorDialog({
  open,
  onClose,
  resource,
  locations,
  tags,
}: ResourceEditorDialogProps) {
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const isEdit = Boolean(resource);

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
      name: '',
      type: 'LECTURE_HALL',
      capacity: 1,
      locationId: '',
      status: 'ACTIVE',
      description: '',
      imageUrl: '',
      dayOfWeek: undefined,
      startTime: '',
      endTime: '',
      tagIds: [],
    },
  });

  const selectedTagIds = watch('tagIds');
  const selectedLocationId = watch('locationId');
  const selectedType = watch('type');
  const selectedStatus = watch('status');
  const selectedDayOfWeek = watch('dayOfWeek');

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (!resource) {
      reset({
        name: '',
        type: 'LECTURE_HALL',
        capacity: 1,
        locationId: '',
        status: 'ACTIVE',
        description: '',
        imageUrl: '',
        dayOfWeek: undefined,
        startTime: '',
        endTime: '',
        tagIds: [],
      });
      return;
    }

    const firstAvailability = resource.availability[0];
    reset({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      locationId: resource.location?.locationId ?? '',
      status: resource.status,
      description: resource.description ?? '',
      imageUrl: resource.imageUrl ?? '',
      dayOfWeek: firstAvailability?.dayOfWeek as DayOfWeek | undefined,
      startTime: firstAvailability?.startTime ?? '',
      endTime: firstAvailability?.endTime ?? '',
      tagIds: resource.tags.map((tag) => tag.tagId),
    });
  }, [open, resource, reset]);

  const toggleTag = (tagId: string, checked: boolean) => {
    const next = checked
      ? [...selectedTagIds, tagId]
      : selectedTagIds.filter((id) => id !== tagId);
    setValue('tagIds', next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = (values: FormValues) => {
    const availability =
      values.dayOfWeek && values.startTime && values.endTime
        ? [{ dayOfWeek: values.dayOfWeek, startTime: values.startTime, endTime: values.endTime }]
        : [];

    const payload: ResourceRequest = {
      name: values.name.trim(),
      type: values.type,
      capacity: values.capacity,
      locationId: values.locationId || undefined,
      status: values.status,
      description: values.description?.trim() || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
      tagIds: values.tagIds,
      availability,
    };

    if (!resource) {
      createResource.mutate(payload, { onSuccess: onClose });
      return;
    }
    updateResource.mutate(
      { resourceId: resource.resourceId, request: payload },
      { onSuccess: onClose }
    );
  };

  const isPending = createResource.isPending || updateResource.isPending;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Resource' : 'Create Resource'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="resource-name">Name</Label>
              <Input id="resource-name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resource-capacity">Capacity</Label>
              <Input id="resource-capacity" type="number" {...register('capacity', { valueAsNumber: true })} />
              {errors.capacity && <p className="text-xs text-destructive">{errors.capacity.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={(value) => setValue('type', value as FormValues['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LECTURE_HALL">Lecture Hall</SelectItem>
                  <SelectItem value="LAB">Lab</SelectItem>
                  <SelectItem value="MEETING_ROOM">Meeting Room</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={(value) => setValue('status', value as FormValues['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                  <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select
              value={selectedLocationId || null}
              onValueChange={(value) => setValue('locationId', value === '__none__' ? '' : (value ?? ''))}
            >
              <SelectTrigger><SelectValue placeholder="No location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.locationId} value={location.locationId}>
                    {location.buildingName} - Floor {location.floorNumber} {location.roomNumber ?? ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resource-description">Description</Label>
            <Input id="resource-description" {...register('description')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resource-image-url">Image URL</Label>
            <Input id="resource-image-url" {...register('imageUrl')} />
            {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
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
            <Label>Availability (optional, single slot)</Label>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Select
                value={selectedDayOfWeek || null}
                onValueChange={(value) => setValue('dayOfWeek', (value as DayOfWeek) ?? undefined)}
              >
                <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MON">MON</SelectItem>
                  <SelectItem value="TUE">TUE</SelectItem>
                  <SelectItem value="WED">WED</SelectItem>
                  <SelectItem value="THU">THU</SelectItem>
                  <SelectItem value="FRI">FRI</SelectItem>
                  <SelectItem value="SAT">SAT</SelectItem>
                  <SelectItem value="SUN">SUN</SelectItem>
                </SelectContent>
              </Select>
              <Input type="time" {...register('startTime')} />
              <Input type="time" {...register('endTime')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
