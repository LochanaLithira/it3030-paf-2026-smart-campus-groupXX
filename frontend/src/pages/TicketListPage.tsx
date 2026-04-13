import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { useTickets } from '@/hooks/useTickets';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';
import type { TicketSummaryResponse, TicketStatus, TicketPriority, TicketCategory } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from '@tanstack/react-router';
import {
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';

const columnHelper = createColumnHelper<TicketSummaryResponse>();

// Status badge styling
function getStatusBadge(status: TicketStatus) {
  const variants = {
    OPEN: { variant: 'default' as const, icon: AlertCircle, color: 'text-blue-600' },
    IN_PROGRESS: { variant: 'secondary' as const, icon: Clock, color: 'text-amber-600' },
    RESOLVED: { variant: 'outline' as const, icon: CheckCircle, color: 'text-green-600' },
    CLOSED: { variant: 'outline' as const, icon: CheckCircle, color: 'text-gray-500' },
    REJECTED: { variant: 'destructive' as const, icon: Ban, color: 'text-red-600' },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status.replace('_', ' ')}
    </Badge>
  );
}

// Priority badge styling
function getPriorityBadge(priority: TicketPriority) {
  const variants = {
    LOW: { variant: 'outline' as const, className: 'border-gray-300 text-gray-700' },
    MEDIUM: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700' },
    HIGH: { variant: 'default' as const, className: 'bg-orange-500 text-white' },
    CRITICAL: { variant: 'destructive' as const, className: 'bg-red-600 text-white' },
  };

  const config = variants[priority];
  return (
    <Badge variant={config.variant} className={config.className}>
      {priority}
    </Badge>
  );
}

export function TicketListPage() {
  const { hasPermission } = useAuthStore();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);
  const [page, setPage] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'ALL'>('ALL');

  const { data, isLoading, isFetching, refetch } = useTickets({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
    category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
    page,
    size: 20,
    sort: sorting[0] ? `${sorting[0].id},${sorting[0].desc ? 'desc' : 'asc'}` : 'createdAt,desc',
  });

  const canCreateTicket = hasPermission(PERMISSIONS.TICKETS_CREATE);
  const canViewAll = hasPermission(PERMISSIONS.TICKETS_VIEW_ALL);

  const columns = [
    columnHelper.accessor('ticketId', {
      header: 'ID',
      cell: (info) => (
        <Link
          to="/tickets/$ticketId"
          params={{ ticketId: info.getValue() }}
          className="font-mono text-xs text-blue-600 hover:underline"
        >
          {info.getValue().slice(0, 8)}
        </Link>
      ),
    }),
    columnHelper.accessor('resource', {
      header: 'Resource',
      cell: (info) => {
        const resource = info.getValue();
        return (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{resource?.name ?? 'N/A'}</div>
            <div className="text-xs text-gray-500">
              {resource?.location?.buildingName} {resource?.location?.roomNumber}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: (info) => (
        <span className="text-sm text-gray-700">
          {info.getValue().replace('_', ' ')}
        </span>
      ),
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: (info) => (
        <div className="max-w-[300px] text-sm text-gray-700 truncate">
          {info.getValue()}
        </div>
      ),
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: (info) => getPriorityBadge(info.getValue()),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => getStatusBadge(info.getValue()),
    }),
    columnHelper.accessor('reporter', {
      header: 'Reporter',
      cell: (info) => (
        <div className="text-sm">
          <div className="font-medium">{info.getValue()?.fullName ?? 'System'}</div>
        </div>
      ),
    }),
    columnHelper.accessor('assignedTech', {
      header: 'Assigned To',
      cell: (info) => {
        const tech = info.getValue();
        return tech ? (
          <div className="text-sm font-medium">{tech.fullName}</div>
        ) : (
          <span className="text-xs text-gray-400 italic">Unassigned</span>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: (info) => (
        <div className="text-sm text-gray-600">
          {format(new Date(info.getValue()), 'MMM d, yyyy')}
        </div>
      ),
    }),
    columnHelper.accessor('dueDate', {
      header: 'Due Date',
      cell: (info) => {
        const dueDate = info.getValue();
        if (!dueDate) return <span className="text-xs text-gray-400">-</span>;
        
        const isPast = new Date(dueDate) < new Date();
        return (
          <div className={`text-sm ${isPast ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
            {format(new Date(dueDate), 'MMM d')}
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: data?.content || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualSorting: false,
  });

  const totalPages = data?.totalPages || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Tickets</h1>
          <p className="text-sm text-gray-600 mt-1">
            {canViewAll
              ? 'View and manage all tickets'
              : 'Your tickets and assigned tickets'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          {canCreateTicket && (
            <Link to="/tickets/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Ticket
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-gray-700">Status</label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-gray-700">Priority</label>
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-gray-700">Category</label>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="ELECTRICAL">Electrical</SelectItem>
              <SelectItem value="PLUMBING">Plumbing</SelectItem>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="FURNITURE">Furniture</SelectItem>
              <SelectItem value="GENERAL_MAINTENANCE">General Maintenance</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !data?.content.length ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-2 text-gray-300" />
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-gray-50">
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-1'
                              : ''
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ChevronUp className="h-4 w-4" />,
                            desc: <ChevronDown className="h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {data.content.length} of {data.totalElements} tickets
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <div className="text-sm text-gray-600">
              Page {page + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
