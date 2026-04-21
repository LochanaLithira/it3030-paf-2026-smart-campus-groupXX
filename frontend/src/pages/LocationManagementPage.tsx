import { useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2, Edit, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeleteLocation, useLocations } from '@/hooks/useLocations';
import { LocationEditorDialog } from '@/components/resources/LocationEditorDialog';
import { useCreateResourceTag, useDeleteResourceTag, useResourceTags, useUpdateResourceTag } from '@/hooks/useResources';
import type { LocationResponse } from '@/types/api';

export function LocationManagementPage() {
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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

      <div className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Building</TableHead>
              <TableHead className="font-semibold">Floor</TableHead>
              <TableHead className="font-semibold">Room</TableHead>
              <TableHead className="font-semibold">Type</TableHead>
              <TableHead className="font-semibold">Capacity</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Tags</TableHead>
              <TableHead className="font-semibold">Availability</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-20 text-center text-muted-foreground">
                  Loading locations...
                </TableCell>
              </TableRow>
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
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => deleteLocation.mutate(location.locationId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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

      <LocationEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        location={selectedLocation}
        tags={tags}
      />
    </div>
  );
}