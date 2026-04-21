import { useMemo, useState } from 'react';
import { Edit, Loader2, Plus, RefreshCw, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ResourceEditorDialog } from '@/components/resources/ResourceEditorDialog';
import { ResourceHeatmap } from '@/components/resources/ResourceHeatmap';
import {
  useDeleteResource,
  useResources,
  useUpdateResourceStatus,
} from '@/hooks/useResources';
import type { ResourceResponse, ResourceStatus } from '@/types/api';

const STATUS_OPTIONS: ResourceStatus[] = ['ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'];

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
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="transition-all duration-200"
                aria-label={isFetching ? "Refreshing resources" : "Refresh resources"}
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
              <p>Refresh resource data</p>
            </TooltipContent>
          </Tooltip>
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

      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search Resources</label>
              <Input
                className="max-w-sm"
                placeholder="Search by resource name..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filter by Status</label>
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
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'ACTIVE' ? 'bg-green-500' :
                          status === 'OUT_OF_SERVICE' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`} />
                        {status}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold min-w-[200px]">Name</TableHead>
                <TableHead className="font-semibold min-w-[120px]">Type</TableHead>
                <TableHead className="font-semibold min-w-[140px]">Status</TableHead>
                <TableHead className="text-right font-semibold min-w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 rounded" /></TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-1">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    No resources found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((resource, index) => (
                  <TableRow key={resource.resourceId} className={`hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {resource.type}
                      </Badge>
                    </TableCell>
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
                        <SelectTrigger className={`w-44 border-0 shadow-none p-0 h-auto font-medium ${
                          resource.status === 'ACTIVE' ? 'text-green-700 dark:text-green-400' :
                          resource.status === 'OUT_OF_SERVICE' ? 'text-red-700 dark:text-red-400' :
                          'text-yellow-700 dark:text-yellow-400'
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  status === 'ACTIVE' ? 'bg-green-500' :
                                  status === 'OUT_OF_SERVICE' ? 'bg-red-500' :
                                  'bg-yellow-500'
                                }`} />
                                {status}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                                setSelectedResource(resource);
                                setEditorOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit resource</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => deleteResource.mutate(resource.resourceId)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Delete resource</p>
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

      {data && data.totalPages > 1 && (
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{rows.length}</span> of{' '}
                  <span className="font-medium">{data.totalElements}</span> resources
                </p>
                <p className="text-sm text-muted-foreground">
                  Page <span className="font-medium">{page + 1}</span> of{' '}
                  <span className="font-medium">{data.totalPages}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(0)}
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="hidden md:inline">First</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">Previous</span>
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = Math.max(0, Math.min(data.totalPages - 1, page - 2 + i));
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-10 h-10 p-0"
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <span className="hidden md:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= data.totalPages}
                  onClick={() => setPage(data.totalPages - 1)}
                  className="hidden sm:flex"
                >
                  <span className="hidden md:inline">Last</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ResourceHeatmap />

      <ResourceEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        resource={selectedResource}
      />
    </div>
  );
}