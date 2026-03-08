import { useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import { useUsers, useDeactivateUser } from '@/hooks/useUsers';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';
import type { UserResponse } from '@/types/api';
import { AssignRolesDialog } from '@/components/users/AssignRolesDialog';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MoreHorizontal,
  Search,
  RefreshCw,
  Loader2,
  UserX,
  Shield,
  ChevronUp,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

const columnHelper = createColumnHelper<UserResponse>();

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserManagementPage() {
  const { hasPermission } = useAuthStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching, refetch } = useUsers({
    search: debouncedSearch || undefined,
    page,
    size: 20,
  });

  const deactivate = useDeactivateUser();

  const canManageRoles = hasPermission(PERMISSIONS.USERS_MANAGE_ROLES);
  const canDeactivate = hasPermission(PERMISSIONS.USERS_DELETE_SOFT);
  const canCreate = hasPermission(PERMISSIONS.USERS_CREATE);

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const columns = [
    columnHelper.display({
      id: 'user',
      header: 'User',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={row.profilePictureUrl ?? undefined} />
              <AvatarFallback>{getInitials(row.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{row.email}</p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor('roles', {
      header: 'Roles',
      cell: (info) => (
        <div className="flex flex-wrap gap-1">
          {info.getValue().length > 0 ? (
            info.getValue().map((role) => (
              <Badge key={role} variant={role === 'ADMIN' ? 'default' : 'secondary'} className="text-xs">
                {role}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">No roles</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('active', {
      header: 'Status',
      cell: (info) => (
        <Badge variant={info.getValue() ? 'default' : 'destructive'} className="text-xs">
          {info.getValue() ? 'Active' : 'Inactive'}
        </Badge>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Joined',
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(info.getValue()), 'MMM d, yyyy')}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const row = info.row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canManageRoles && (
                <DropdownMenuItem onClick={() => setSelectedUser(row)}>
                  <Shield className="mr-2 h-4 w-4" />
                  Assign Roles
                </DropdownMenuItem>
              )}
              {canDeactivate && row.active && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deactivate.mutate(row.userId)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: data?.content ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? 0,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            {data ? `${data.totalElements} user${data.totalElements !== 1 ? 's' : ''} total` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && (
                        <ChevronUp className="h-3 w-3" />
                      )}
                      {header.column.getIsSorted() === 'desc' && (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.last}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Assign roles dialog */}
      <AssignRolesDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />

      {/* Create user dialog */}
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
