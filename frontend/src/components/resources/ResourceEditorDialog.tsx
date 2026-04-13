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
import { AvailabilityScheduleEditor } from '@/components/resources/AvailabilityScheduleEditor';
import { useCreateResource, useUpdateResource } from '@/hooks/useResources';
import type { DayOfWeek, ResourceRequest, ResourceResponse } from '@/types/api';

const schema = z.object({
  name: z.string().min(1, 'Resource name is required').max(150),
});

type FormValues = z.infer<typeof schema>;

interface ResourceEditorDialogProps {
  open: boolean;
  onClose: () => void;
  resource?: ResourceResponse | null;
}

function mapAvailabilityFromApi(resource: ResourceResponse) {
  return resource.availability.map((r) => ({
    dayOfWeek: r.dayOfWeek as DayOfWeek,
    startTime: r.startTime.length === 5 ? `${r.startTime}:00` : r.startTime,
    endTime: r.endTime.length === 5 ? `${r.endTime}:00` : r.endTime,
  }));
}

export function ResourceEditorDialog({ open, onClose, resource }: ResourceEditorDialogProps) {
  const createResource = useCreateResource();
  const updateResource = useUpdateResource();
  const isEdit = Boolean(resource);

  const [availability, setAvailability] = useState<
    NonNullable<ResourceRequest['availability']>
  >([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) {
      reset();
      setAvailability([]);
      return;
    }
    if (resource) {
      reset({ name: resource.name });
      setAvailability(mapAvailabilityFromApi(resource));
    } else {
      reset({ name: '' });
      setAvailability([]);
    }
  }, [open, resource, reset]);

  const onSubmit = (values: FormValues) => {
    const payload: ResourceRequest = resource
      ? {
          name: values.name.trim(),
          type: resource.type,
          capacity: resource.capacity,
          locationId: resource.location?.locationId,
          status: resource.status,
          description: resource.description ?? undefined,
          imageUrl: resource.imageUrl ?? undefined,
          tagIds: resource.tags.map((t) => t.tagId),
          availability,
        }
      : {
          name: values.name.trim(),
          type: 'EQUIPMENT',
          capacity: 1,
          status: 'ACTIVE',
          tagIds: [],
          availability,
        };

    if (!resource) {
      createResource.mutate(payload, { onSuccess: onClose });
      return;
    }
    updateResource.mutate(
      { resourceId: resource.resourceId, request: payload },
      { onSuccess: onClose },
    );
  };

  const isPending = createResource.isPending || updateResource.isPending;
  const editorKey = resource?.resourceId ?? 'new';

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Resource' : 'Create Resource'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="resource-name">Name</Label>
            <Input id="resource-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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
              {isEdit ? 'Save Changes' : 'Create Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
