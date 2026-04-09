import { useMemo, useState } from 'react';
import { Plus, RefreshCw, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDeleteLocation, useLocations } from '@/hooks/useLocations';
import { LocationEditorDialog } from '@/components/resources/LocationEditorDialog';
import type { LocationResponse } from '@/types/api';

export function LocationManagementPage() {
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);
  const { data: locations = [], isLoading, isFetching, refetch } = useLocations({
    building: search || undefined,
  });
  const deleteLocation = useDeleteLocation();

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Building</TableHead>
              <TableHead>Floor</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  Loading locations...
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                  No locations found.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((location) => (
                <TableRow key={location.locationId}>
                  <TableCell>{location.buildingName}</TableCell>
                  <TableCell>{location.floorNumber}</TableCell>
                  <TableCell>{location.roomNumber ?? '-'}</TableCell>
                  <TableCell>{location.description ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
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

      <LocationEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        location={selectedLocation}
      />
    </div>
  );
}