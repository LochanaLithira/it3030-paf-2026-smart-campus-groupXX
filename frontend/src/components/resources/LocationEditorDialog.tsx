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
import { useCreateLocation, useUpdateLocation } from '@/hooks/useLocations';
import type { LocationResponse } from '@/types/api';

const schema = z.object({
  buildingName: z.string().min(1, 'Building name is required').max(100),
  floorNumber: z.number()
    .int('Floor number must be an integer')
    .min(-10, 'Floor number cannot be less than -10')
    .max(300, 'Floor number cannot be greater than 300'),
  roomNumber: z.string().max(20).optional().or(z.literal('')),
  description: z.string().max(2000, 'Description is too long').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface LocationEditorDialogProps {
  open: boolean;
  onClose: () => void;
  location?: LocationResponse | null;
}

export function LocationEditorDialog({ open, onClose, location }: LocationEditorDialogProps) {
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const isEdit = Boolean(location);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      buildingName: '',
      floorNumber: 0,
      roomNumber: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    if (location) {
      reset({
        buildingName: location.buildingName,
        floorNumber: location.floorNumber,
        roomNumber: location.roomNumber ?? '',
        description: location.description ?? '',
      });
    } else {
      reset({
        buildingName: '',
        floorNumber: 0,
        roomNumber: '',
        description: '',
      });
    }
  }, [open, location, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      buildingName: values.buildingName.trim(),
      floorNumber: values.floorNumber,
      roomNumber: values.roomNumber?.trim() || undefined,
      description: values.description?.trim() || undefined,
    };

    if (!location) {
      createLocation.mutate(payload, { onSuccess: onClose });
      return;
    }
    updateLocation.mutate(
      { locationId: location.locationId, request: payload },
      { onSuccess: onClose }
    );
  };

  const isPending = createLocation.isPending || updateLocation.isPending;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Location' : 'Create Location'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="location-building">Building Name</Label>
            <Input id="location-building" {...register('buildingName')} />
            {errors.buildingName && <p className="text-xs text-destructive">{errors.buildingName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location-floor">Floor Number</Label>
            <Input id="location-floor" type="number" {...register('floorNumber', { valueAsNumber: true })} />
            {errors.floorNumber && <p className="text-xs text-destructive">{errors.floorNumber.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location-room">Room Number</Label>
            <Input id="location-room" {...register('roomNumber')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location-description">Description</Label>
            <Input id="location-description" {...register('description')} />
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
