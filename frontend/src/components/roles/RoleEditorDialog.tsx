import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PermissionSelector } from './PermissionSelector';
import { useCreateRole, useUpdateRole } from '@/hooks/useRoles';
import type { RoleResponse } from '@/types/api';

interface RoleEditorDialogProps {
  open: boolean;
  onClose: () => void;
  /** If provided, we're editing an existing role; otherwise creating */
  role?: RoleResponse | null;
}

const schema = z.object({
  roleName: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must be at most 50 characters'),
});
type FormValues = z.infer<typeof schema>;

export function RoleEditorDialog({ open, onClose, role }: RoleEditorDialogProps) {
  const isEditing = Boolean(role);
  const [permissions, setPermissions] = useState<string[]>([]);

  const { mutate: createRole, isPending: isCreating } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Populate form when editing
  useEffect(() => {
    if (role) {
      reset({ roleName: role.roleName });
      setPermissions(role.permissions);
    } else {
      reset({ roleName: '' });
      setPermissions([]);
    }
  }, [role, reset, open]);

  const onSubmit = (values: FormValues) => {
    if (isEditing && role) {
      updateRole(
        { roleId: role.roleId, request: { permissions } },
        { onSuccess: onClose }
      );
    } else {
      createRole(
        { roleName: values.roleName, permissions },
        { onSuccess: onClose }
      );
    }
  };

  const handleClose = () => {
    reset();
    setPermissions([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Edit Role: ${role?.roleName}` : 'Create Role'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Role Name — only editable on create */}
          {!isEditing && (
            <div className="space-y-1">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                placeholder="e.g. MANAGER"
                {...register('roleName')}
                className={errors.roleName ? 'border-destructive' : ''}
              />
              {errors.roleName && (
                <p className="text-xs text-destructive">{errors.roleName.message}</p>
              )}
            </div>
          )}

          {/* Permissions */}
          <div className="flex-1 min-h-0 space-y-1">
            <Label>Permissions</Label>
            <PermissionSelector selected={permissions} onChange={setPermissions} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating
                ? isEditing
                  ? 'Saving…'
                  : 'Creating…'
                : isEditing
                ? 'Save Changes'
                : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
