import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Shield, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RoleEditorDialog } from '@/components/roles/RoleEditorDialog';
import { useRoles, useDeleteRole } from '@/hooks/useRoles';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';
import type { RoleResponse } from '@/types/api';

export function RoleManagementPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleResponse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleResponse | null>(null);

  const { data: roles = [], isLoading } = useRoles();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();
  const hasPermission = useAuthStore((s) => s.hasPermission);

  const canCreate = hasPermission(PERMISSIONS.ROLES_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.ROLES_UPDATE);
  const canDelete = hasPermission(PERMISSIONS.ROLES_DELETE);

  const columns: ColumnDef<RoleResponse>[] = [
    {
      accessorKey: 'roleName',
      header: 'Role Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.roleName}</span>
        </div>
      ),
    },
    {
      id: 'permCount',
      header: 'Permissions',
      accessorFn: (row) => row.permissions.length,
      cell: ({ row }) => {
        const count = row.original.permissions.length;
        return (
          <Badge variant={count === 0 ? 'outline' : 'secondary'}>
            {count} {count === 1 ? 'permission' : 'permissions'}
          </Badge>
        );
      },
    },
    {
      id: 'permPreview',
      header: 'Sample Permissions',
      cell: ({ row }) => {
        const perms = row.original.permissions.slice(0, 3);
        const rest = row.original.permissions.length - 3;
        return (
          <div className="flex flex-wrap gap-1">
            {perms.map((p) => (
              <code key={p} className="text-[10px] bg-muted px-1 rounded">
                {p}
              </code>
            ))}
            {rest > 0 && (
              <span className="text-xs text-muted-foreground">+{rest} more</span>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end">
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedRole(row.original);
                setEditorOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: roles,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleOpenCreate = () => {
    setSelectedRole(null);
    setEditorOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteRole(deleteTarget.roleId, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground text-sm">
            Create and configure roles with granular permission assignments.
          </p>
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Roles', value: roles.length },
          {
            label: 'Avg. Permissions',
            value: roles.length
              ? Math.round(
                  roles.reduce((acc, r) => acc + r.permissions.length, 0) / roles.length
                )
              : 0,
          },
          {
            label: 'Roles with No Permissions',
            value: roles.filter((r) => r.permissions.length === 0).length,
          },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="rounded-md border">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-3 border-b">
          <Input
            placeholder="Search roles…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-xs h-8"
          />
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground">
                            {sorted === 'asc' ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronsUpDown className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  Loading roles…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  No roles found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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

      {/* Role create/edit dialog */}
      <RoleEditorDialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        role={selectedRole}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteTarget?.roleName}</span>? This cannot be
              undone and may affect users assigned to this role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
