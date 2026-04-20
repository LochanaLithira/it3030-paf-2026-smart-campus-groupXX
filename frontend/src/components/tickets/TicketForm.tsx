import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useLocations } from '@/hooks/useLocations';
import { useResources } from '@/hooks/useResources';
import type { LocationResponse, ResourceType, TicketCategory, TicketPriority } from '@/types/api';

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_ATTACHMENTS = 3;

const ticketFormSchema = z
  .object({
    resourceId: z.string().optional(),
    locationId: z.string().optional(),
    category: z.enum([
      'ELECTRICAL',
      'PLUMBING',
      'HVAC',
      'IT',
      'HARDWARE',
      'SOFTWARE',
      'NETWORK',
      'EQUIPMENT_DAMAGE',
      'FURNITURE',
      'CLEANING',
      'SAFETY_HAZARD',
      'GENERAL_MAINTENANCE',
      'OTHER',
    ] as const, {
      message: 'Category is required',
    }),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const, {
      message: 'Priority is required',
    }),
    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must not exceed 2000 characters'),
    // PDF requirement: separate email and phone fields
    preferredContactEmail: z
      .string()
      .email('Invalid email format')
      .refine(
        (val) => !val || val.endsWith('@my.sliit.lk') || val.endsWith('@gmail.com'),
        'Email must be a @my.sliit.lk or @gmail.com address'
      )
      .max(150, 'Email must not exceed 150 characters')
      .optional()
      .or(z.literal('')),
    preferredContactPhone: z
      .string()
      .regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone format (10-15 digits, + optional)')
      .optional()
      .or(z.literal('')),
    dueDate: z.date().optional(),
    attachments: z
      .array(z.instanceof(File))
      .max(MAX_ATTACHMENTS, `Maximum ${MAX_ATTACHMENTS} attachments allowed`)
      .refine(
        (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
        `Each file must be less than 3MB`
      )
      .refine(
        (files) => files.every((file) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
        'Only .jpg, .jpeg, .png and .webp formats are supported'
      )
      .optional(),
  })
  .refine(
    (values) => {
      const hasResource = Boolean(values.resourceId?.trim());
      const hasLocation = Boolean(values.locationId?.trim());
      return hasResource !== hasLocation;
    },
    {
      message: 'Select either a resource or a location',
      path: ['resourceId'],
    }
  );

export type TicketFormValues = z.infer<typeof ticketFormSchema>;

interface TicketFormProps {
  onSubmit: (values: TicketFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  defaultValues?: Partial<TicketFormValues>;
}

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  IT: 'IT / Technology',
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software / Access',
  NETWORK: 'Network / Wi-Fi',
  EQUIPMENT_DAMAGE: 'Equipment Damage',
  FURNITURE: 'Furniture',
  CLEANING: 'Cleaning / Janitorial',
  SAFETY_HAZARD: 'Safety Hazard',
  GENERAL_MAINTENANCE: 'General Maintenance',
  OTHER: 'Other',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const RESOURCE_TYPE_OPTIONS: ResourceType[] = ['LECTURE_HALL', 'LAB', 'MEETING_ROOM', 'EQUIPMENT'];

export function TicketForm({ onSubmit, onCancel, isLoading, defaultValues }: TicketFormProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [resourceTypeFilter, setResourceTypeFilter] = useState<ResourceType | ''>('');
  const { data: resourcesData, isLoading: resourcesLoading, isError: resourcesError } = useResources({
    size: 1000,
    status: 'ACTIVE',
    type: resourceTypeFilter || undefined,
  });
  const { data: locationsData, isLoading: locationsLoading, isError: locationsError } = useLocations();

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      resourceId: defaultValues?.resourceId || '',
      locationId: defaultValues?.locationId || '',
      category: defaultValues?.category || undefined,
      priority: defaultValues?.priority || 'MEDIUM',
      description: defaultValues?.description || '',
      preferredContactEmail: defaultValues?.preferredContactEmail || '',
      preferredContactPhone: defaultValues?.preferredContactPhone || '',
      dueDate: defaultValues?.dueDate || undefined,
      attachments: [],
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = [...selectedFiles, ...files].slice(0, MAX_ATTACHMENTS);
    setSelectedFiles(newFiles);
    form.setValue('attachments', newFiles, { shouldValidate: true });
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    form.setValue('attachments', newFiles, { shouldValidate: true });
  };

  const handleSubmit = async (values: TicketFormValues) => {
    await onSubmit(values);
  };

  const resources = resourcesData?.content || [];
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
  const assetsError = resourcesError || locationsError;
  const selectedLocationId = form.watch('locationId');

  useEffect(() => {
    const currentResourceId = form.getValues('resourceId');
    if (currentResourceId && !resources.some((resource) => resource.resourceId === currentResourceId)) {
      form.setValue('resourceId', '', { shouldValidate: true });
    }
  }, [form, resources]);

  useEffect(() => {
    const currentLocationId = form.getValues('locationId');
    if (currentLocationId && !locations.some((location) => location.locationId === currentLocationId)) {
      form.setValue('locationId', '', { shouldValidate: true });
    }
  }, [form, locations]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>Filter by type</Label>
          <Select
            value={resourceTypeFilter || 'ALL'}
            onValueChange={(value) => setResourceTypeFilter(value === 'ALL' ? '' : (value as ResourceType))}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              {RESOURCE_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resource Or Location Selector */}
        <FormField
          control={form.control}
          name="resourceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resource or Location *</FormLabel>
              <Select
                value={field.value ? field.value : selectedLocationId ? `_location_${selectedLocationId}` : undefined}
                onValueChange={(value) => {
                  if (!value) {
                    form.setValue('locationId', '', { shouldDirty: true, shouldValidate: true });
                    field.onChange('');
                    return;
                  }
                  if (value.startsWith('_location_')) {
                    form.setValue('locationId', value.replace('_location_', ''), {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                    field.onChange('');
                    return;
                  }
                  form.setValue('locationId', '', { shouldDirty: true, shouldValidate: true });
                  field.onChange(value);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resource or location" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assetsLoading && (
                    <SelectItem value="_loading" disabled>
                      Loading resources and locations...
                    </SelectItem>
                  )}
                  {assetsError && (
                    <SelectItem value="_error" disabled>
                      ⚠ Permission error — please log out and log back in
                    </SelectItem>
                  )}
                  {!assetsError && !assetsLoading && resources.length === 0 && locations.length === 0 && (
                    <SelectItem value="_empty" disabled>
                      No resources or locations available
                    </SelectItem>
                  )}
                  {resources.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Resources</SelectLabel>
                      {resources.map((resource) => (
                        <SelectItem key={resource.resourceId} value={resource.resourceId}>
                          {resource.name} — {resource.type.replace(/_/g, ' ')}
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
                          <SelectItem key={location.locationId} value={`_location_${location.locationId}`}>
                            {location.buildingName} — Floor {location.floorNumber}
                            {location.roomNumber ? `, Room ${location.roomNumber}` : ''}
                            {` (${location.type.replace(/_/g, ' ')})`}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </>
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Select either a resource or a location for this ticket.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.entries(CATEGORY_LABELS) as [TicketCategory, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormDescription>Type of issue or maintenance needed</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Priority */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Priority *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(Object.entries(PRIORITY_LABELS) as [TicketPriority, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormDescription>How urgent is this issue?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the issue in detail..."
                  className="min-h-[120px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Minimum 10 characters. Be specific about the problem.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Due Date */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date (Optional)</FormLabel>
              <Popover>
                <FormControl>
                  <PopoverTrigger
                    className={cn(
                      'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </PopoverTrigger>
                </FormControl>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>When do you need this resolved by?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preferred Contact Email */}
        <FormField
          control={form.control}
          name="preferredContactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Contact Email (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="youremail@my.sliit.lk or youremail@gmail.com "
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Email address for non-urgent follow-ups
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preferred Contact Phone */}
        <FormField
          control={form.control}
          name="preferredContactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Contact Phone (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+94771234567 or 0771234567"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Phone number for urgent contact (10-15 digits)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Attachments */}
        <FormField
          control={form.control}
          name="attachments"
          render={() => (
            <FormItem>
              <FormLabel>Attachments (Optional)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={selectedFiles.length >= MAX_ATTACHMENTS}
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedFiles.length} / {MAX_ATTACHMENTS} files
                    </span>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={selectedFiles.length >= MAX_ATTACHMENTS}
                  />

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-md border p-2"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-10 overflow-hidden rounded">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{file.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                Upload up to {MAX_ATTACHMENTS} images (max 3MB each). JPG, PNG, WebP supported.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Ticket'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
