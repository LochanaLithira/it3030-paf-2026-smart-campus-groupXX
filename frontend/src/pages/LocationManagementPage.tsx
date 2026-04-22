import { useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2, Edit, Tag, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDeleteLocation, useLocations } from '@/hooks/useLocations';
import { LocationEditorDialog } from '@/components/resources/LocationEditorDialog';
import { useCreateResourceTag, useDeleteResourceTag, useResourceTags, useUpdateResourceTag } from '@/hooks/useResources';
import type { LocationResponse } from '@/types/api';

export function LocationManagementPage() {
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLocationId, setDeleteLocationId] = useState<string | null>(null);
  const { data: locations = [], isLoading, isFetching, refetch } = useLocations({
    building: search || undefined,
  });
  const { data: tags = [] } = useResourceTags();
  const deleteLocation = useDeleteLocation();
  const createTag = useCreateResourceTag();
  const updateTag = useUpdateResourceTag();
  const deleteTag = useDeleteResourceTag();
  const [newTagName, setNewTagName] = useState('');

  const sorted = useMemo(
    () =>
      [...locations].sort((a, b) => {
        if (a.buildingName !== b.buildingName) {
          return a.buildingName.localeCompare(b.buildingName);
        }
        return a.floorNumber - b.floorNumber;
      }),
    [locations]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">{locations.length} location(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="transition-all duration-200"
                aria-label={isFetching ? "Refreshing locations" : "Refresh locations"}
              >
                {isFetching ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isFetching ? 'Refreshing...' : 'Refresh'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refresh location data</p>
            </TooltipContent>
          </Tooltip>
          <Button
            size="sm"
            onClick={() => {
              setSelectedLocation(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>
      </div>

      <div className="max-w-sm">
        <Input
          placeholder="Search by building..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold min-w-[120px]">Building</TableHead>
                <TableHead className="font-semibold min-w-[80px]">Floor</TableHead>
                <TableHead className="font-semibold min-w-[100px]">Room</TableHead>
                <TableHead className="font-semibold min-w-[120px]">Type</TableHead>
                <TableHead className="font-semibold min-w-[80px]">Capacity</TableHead>
                <TableHead className="font-semibold min-w-[120px]">Status</TableHead>
                <TableHead className="font-semibold min-w-[100px]">Tags</TableHead>
                <TableHead className="font-semibold min-w-[100px]">Availability</TableHead>
                <TableHead className="text-right font-semibold min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                  No locations found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((location, index) => (
                <TableRow key={location.locationId} className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                  <TableCell className="font-medium">{location.buildingName}</TableCell>
                  <TableCell>{location.floorNumber}</TableCell>
                  <TableCell>{location.roomNumber ?? '-'}</TableCell>
                  <TableCell>{location.type}</TableCell>
                  <TableCell>{location.capacity}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      location.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                      location.status === 'OUT_OF_SERVICE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {location.status}
                    </span>
                  </TableCell>
                  <TableCell>{location.tags.map((tag) => tag.tagName).join(', ') || '-'}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${location.availability.length > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                      {location.availability.length}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              setSelectedLocation(location);
                              setEditorOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit location</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              setDeleteLocationId(location.locationId);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete location</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle
            className="flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
            onClick={() => setTagsExpanded(!tagsExpanded)}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tag Management
              <span className="text-sm font-normal text-muted-foreground">({tags.length} tags)</span>
            </div>
            {tagsExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        {tagsExpanded && (
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New tag name"
                value={newTagName}
                onChange={(event) => setNewTagName(event.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  const trimmed = newTagName.trim();
                  if (!trimmed) return;
                  createTag.mutate({ tagName: trimmed }, { onSuccess: () => setNewTagName('') });
                }}
                disabled={createTag.isPending}
                className="shrink-0"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tag
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {tags.map((tag) => (
                <div key={tag.tagId} className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                  <Input
                    defaultValue={tag.tagName}
                    onBlur={(event) => {
                      const next = event.target.value.trim();
                      if (!next || next === tag.tagName) return;
                      updateTag.mutate({ tagId: tag.tagId, request: { tagName: next } });
                    }}
                    className="flex-1 h-8 text-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive shrink-0"
                    onClick={() => deleteTag.mutate(tag.tagId)}
                    disabled={deleteTag.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Location"
        description="Are you sure you want to delete this location? This action cannot be undone and will remove all associated data."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteLocationId) {
            deleteLocation.mutate(deleteLocationId, {
              onSuccess: () => {
                setDeleteDialogOpen(false);
                setDeleteLocationId(null);
              },
            });
          }
        }}
        isPending={deleteLocation.isPending}
      />

      <LocationEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        location={selectedLocation}
        tags={tags}
      />
    </div>
  );
}