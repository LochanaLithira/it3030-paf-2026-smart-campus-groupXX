import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateResource, useUpdateResource } from '@/hooks/useResources';
import type {
  AvailabilityRecurrenceType,
  DayOfWeek,
  LocationResponse,
  ResourceRequest,
  ResourceResponse,
} from '@/types/api';

const schema = z
  .object({
    name: z.string().min(1, 'Resource name is required').max(150),
    type: z.enum(['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']),
    capacity: z.number().int().min(1, 'Capacity must be at least 1'),
    locationId: z.string().optional(),
    status: z.enum(['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE']),
    description: z.string().max(5000, 'Description is too long').optional().or(z.literal('')),
    imageUrl: z.union([
      z.string().url('Image URL must be valid'),
      z.literal(''),
      z.undefined()
    ]),
    availability: z.array(z.object({
      recurrenceType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
      dayOfWeek: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']).optional(),
      dayOfMonth: z.number().int().min(1).max(31).optional(),
      startTime: z.string().min(1, 'Start time is required'),
      endTime: z.string().min(1, 'End time is required'),
    })),
  })
  .superRefine((values, ctx) => {
    values.availability.forEach((slot, index) => {
      if (slot.recurrenceType === 'WEEKLY' && !slot.dayOfWeek) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Weekly slots require day of week',
          path: ['availability', index, 'dayOfWeek'],
        });
      }
      if (slot.recurrenceType === 'MONTHLY' && !slot.dayOfMonth) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Monthly slots require day of month',
          path: ['availability', index, 'dayOfMonth'],
        });
      }
      if (slot.startTime >= slot.endTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End time must be after start time',
          path: ['availability', index, 'endTime'],
        });
      }
    });
  });

type FormValues = z.infer<typeof schema>;

interface ResourceEditorDialogProps {
  open: boolean;
  onClose: () => void;
  resource?: ResourceResponse | null;
  locations: LocationResponse[];
}

export function ResourceEditorDialog({
  open,
  onClose,
  resource,
  locations,
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
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      type: 'EQUIPMENT',
      capacity: 1,
      locationId: '',
      status: 'ACTIVE',
      description: '',
      imageUrl: '',
      availability: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'availability',
  });

  const selectedLocationId = watch('locationId');
  const selectedType = watch('type');
  const selectedStatus = watch('status');

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (!resource) {
      reset({
        name: '',
        type: 'EQUIPMENT',
        capacity: 1,
        locationId: '',
        status: 'ACTIVE',
        description: '',
        imageUrl: '',
        availability: [],
      });
      return;
    }

    reset({
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity,
      locationId: resource.location?.locationId ?? '',
      status: resource.status,
      description: resource.description ?? '',
      imageUrl: resource.imageUrl ?? '',
      availability: resource.availability.map((slot) => ({
        recurrenceType: slot.recurrenceType,
        dayOfWeek: slot.dayOfWeek ?? undefined,
        dayOfMonth: slot.dayOfMonth ?? undefined,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });
  }, [open, resource, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: ResourceRequest = {
      name: values.name.trim(),
      type: values.type,
      capacity: values.capacity,
      locationId: values.locationId || undefined,
      status: values.status,
      description: values.description?.trim() || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
      availability: values.availability,
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
            <div className="flex items-center justify-between">
              <Label>Availability</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ recurrenceType: 'WEEKLY', dayOfWeek: 'MON', dayOfMonth: undefined, startTime: '', endTime: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Slot
              </Button>
            </div>
            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground">No availability slots added.</p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                    <Select
                      value={watch(`availability.${index}.recurrenceType`)}
                      onValueChange={(value) => {
                        const nextType = value as AvailabilityRecurrenceType;
                        setValue(`availability.${index}.recurrenceType`, nextType, { shouldDirty: true, shouldValidate: true });
                        if (nextType === 'WEEKLY') {
                          setValue(`availability.${index}.dayOfWeek`, 'MON', { shouldDirty: true, shouldValidate: true });
                          setValue(`availability.${index}.dayOfMonth`, undefined, { shouldDirty: true, shouldValidate: true });
                        } else if (nextType === 'MONTHLY') {
                          setValue(`availability.${index}.dayOfWeek`, undefined, { shouldDirty: true, shouldValidate: true });
                          setValue(`availability.${index}.dayOfMonth`, 1, { shouldDirty: true, shouldValidate: true });
                        } else {
                          setValue(`availability.${index}.dayOfWeek`, undefined, { shouldDirty: true, shouldValidate: true });
                          setValue(`availability.${index}.dayOfMonth`, undefined, { shouldDirty: true, shouldValidate: true });
                        }
                      }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    {watch(`availability.${index}.recurrenceType`) === 'WEEKLY' ? (
                      <Select
                        value={watch(`availability.${index}.dayOfWeek`) || null}
                        onValueChange={(value) =>
                          setValue(`availability.${index}.dayOfWeek`, value as DayOfWeek, { shouldDirty: true, shouldValidate: true })
                        }
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
                    ) : watch(`availability.${index}.recurrenceType`) === 'MONTHLY' ? (
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={watch(`availability.${index}.dayOfMonth`) ?? ''}
                        onChange={(event) =>
                          setValue(
                            `availability.${index}.dayOfMonth`,
                            event.target.value === '' ? undefined : Number(event.target.value),
                            { shouldDirty: true, shouldValidate: true }
                          )
                        }
                        placeholder="Day (1-31)"
                      />
                    ) : (
                      <Input value="Every day" disabled />
                    )}
                    <Input type="time" {...register(`availability.${index}.startTime`)} />
                    <Input type="time" {...register(`availability.${index}.endTime`)} />
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {errors.availability && (
              <p className="text-xs text-destructive">Please fix availability entries.</p>
            )}
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