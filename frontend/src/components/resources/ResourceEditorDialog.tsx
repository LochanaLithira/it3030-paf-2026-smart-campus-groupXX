import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, Package, Settings, Clock } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ResourceRequest,
  ResourceResponse,
} from '@/types/api';

const schema = z
  .object({
    name: z.string().min(1, 'Resource name is required').max(150),
    type: z.enum(['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT']),
    status: z.enum(['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE']),
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
}

export function ResourceEditorDialog({
  open,
  onClose,
  resource,
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
      status: 'ACTIVE',
      availability: [],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'availability',
  });

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
        status: 'ACTIVE',
        availability: [],
      });
      return;
    }

    reset({
      name: resource.name,
      type: resource.type,
      status: resource.status,
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
      status: values.status,
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {isEdit ? 'Edit Resource' : 'Create Resource'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Resource Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="resource-name" className="text-sm font-medium">Resource Name *</Label>
                <Input id="resource-name" {...register('name')} className={errors.name ? 'border-destructive' : ''} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Type *</Label>
                  <Select value={selectedType} onValueChange={(value) => setValue('type', value as FormValues['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LECTURE_HALL">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Lecture Hall
                        </div>
                      </SelectItem>
                      <SelectItem value="LAB">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          Lab
                        </div>
                      </SelectItem>
                      <SelectItem value="MEETING_ROOM">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Meeting Room
                        </div>
                      </SelectItem>
                      <SelectItem value="EQUIPMENT">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          Equipment
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Status *</Label>
                  <Select value={selectedStatus} onValueChange={(value) => setValue('status', value as FormValues['status'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          Active
                        </div>
                      </SelectItem>
                      <SelectItem value="OUT_OF_SERVICE">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Out of Service
                        </div>
                      </SelectItem>
                      <SelectItem value="UNDER_MAINTENANCE">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500" />
                          Under Maintenance
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Availability Schedule
                  <span className="text-sm font-normal text-muted-foreground">({fields.length} slots)</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ recurrenceType: 'WEEKLY', dayOfWeek: 'MON', dayOfMonth: undefined, startTime: '', endTime: '' })}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Slot
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No availability slots added.</p>
                  <p className="text-xs text-muted-foreground mt-1">Add slots to define when this resource is available for booking.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <Card key={field.id} className="border-l-4 border-l-primary/20">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Recurrence</Label>
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
                              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DAILY">Daily</SelectItem>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {watch(`availability.${index}.recurrenceType`) === 'WEEKLY' ? (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">Day</Label>
                              <Select
                                value={watch(`availability.${index}.dayOfWeek`) || '__none__'}
                                onValueChange={(value) =>
                                  setValue(
                                    `availability.${index}.dayOfWeek`,
                                    value === '__none__' ? undefined : (value as DayOfWeek),
                                    { shouldDirty: true, shouldValidate: true }
                                  )
                                }
                              >
                                <SelectTrigger className="h-8"><SelectValue placeholder="Day" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__" disabled>Select day</SelectItem>
                                  <SelectItem value="MON">MON</SelectItem>
                                  <SelectItem value="TUE">TUE</SelectItem>
                                  <SelectItem value="WED">WED</SelectItem>
                                  <SelectItem value="THU">THU</SelectItem>
                                  <SelectItem value="FRI">FRI</SelectItem>
                                  <SelectItem value="SAT">SAT</SelectItem>
                                  <SelectItem value="SUN">SUN</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : watch(`availability.${index}.recurrenceType`) === 'MONTHLY' ? (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">Day of Month</Label>
                              <Input
                                type="number"
                                min={1}
                                max={31}
                                className="h-8"
                                value={watch(`availability.${index}.dayOfMonth`) ?? ''}
                                onChange={(event) =>
                                  setValue(
                                    `availability.${index}.dayOfMonth`,
                                    event.target.value === '' ? undefined : Number(event.target.value),
                                    { shouldDirty: true, shouldValidate: true }
                                  )
                                }
                                placeholder="1-31"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium text-muted-foreground">Schedule</Label>
                              <Input value="Every day" disabled className="h-8" />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
                            <Input type="time" {...register(`availability.${index}.startTime`)} className="h-8" />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
                            <Input type="time" {...register(`availability.${index}.endTime`)} className="h-8" />
                          </div>

                          <div className="flex items-end">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {errors.availability && (
                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-xs text-destructive">Please fix availability entries.</p>
                </div>
              )}
            </CardContent>
          </Card>

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