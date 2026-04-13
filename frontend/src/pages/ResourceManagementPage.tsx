import { useMemo, useState } from 'react';
import { Edit, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResourceEditorDialog } from '@/components/resources/ResourceEditorDialog';
import {
  useDeleteResource,
  useResources,
  useUpdateResourceStatus,
} from '@/hooks/useResources';
import type { ResourceResponse, ResourceStatus } from '@/types/api';

const STATUS_OPTIONS: ResourceStatus[] = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];

function resourceAvailabilitySummary(resource: ResourceResponse): string {
  const n = resource.availability.length;
  if (n === 0) return '—';
  const first = resource.availability[0];
  return n === 1
    ? `${first.dayOfWeek} ${first.startTime.slice(0, 5)}–${first.endTime.slice(0, 5)}`
    : `${n} slots`;
}

export function ResourceManagementPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceResponse | null>(null);
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | ''>('');

  const { data, isLoading, isFetching, refetch } = useResources({
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    size: 20,
  });
  const updateStatus = useUpdateResourceStatus();
  const deleteResource = useDeleteResource();

  const rows = useMemo(() => data?.content ?? [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Management</h1>
          <p className="text-muted-foreground">
            {data ? `${data.totalElements} resource(s)` : 'Loading...'}
          </p>
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
              setSelectedResource(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          className="max-w-sm"
          placeholder="Search by name or description..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
        />
        <Select
          value={statusFilter || '__all__'}
          onValueChange={(value) => {
            const next = value === '__all__' ? '' : (value as ResourceStatus);
            setStatusFilter(next);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            {STATUS_OPTIONS.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                  Loading resources...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                  No resources found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((resource) => (
                <TableRow key={resource.resourceId}>
                  <TableCell className="font-medium">{resource.name}</TableCell>
                  <TableCell>
                    <Select
                      value={resource.status}
                      onValueChange={(value) =>
                        updateStatus.mutate({
                          resourceId: resource.resourceId,
                          status: value as ResourceStatus,
                        })
                      }
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {resourceAvailabilitySummary(resource)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedResource(resource);
                          setEditorOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => deleteResource.mutate(resource.resourceId)}
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

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ResourceEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        resource={selectedResource}
      />
    </div>
  );
}