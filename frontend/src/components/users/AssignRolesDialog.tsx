import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useRoles } from '@/hooks/useRoles';
import { useUpdateUserRoles } from '@/hooks/useUsers';
import type { UserResponse } from '@/types/api';

interface AssignRolesDialogProps {
  user: UserResponse | null;
  onClose: () => void;
}

export function AssignRolesDialog({ user, onClose }: AssignRolesDialogProps) {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const updateRoles = useUpdateUserRoles();
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? []);

  const handleToggle = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    await updateRoles.mutateAsync({ userId: user.userId, request: { roleNames: selectedRoles } });
    onClose();
  };

  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Update roles for <strong>{user?.fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-3">
            Current roles:{' '}
            {user?.roles.length
              ? user.roles.map((r) => (
                  <Badge key={r} variant="secondary" className="mr-1 text-xs">
                    {r}
                  </Badge>
                ))
              : 'None'}
          </p>

          {rolesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-56">
              <div className="space-y-2 pr-2">
                {roles.map((role) => {
                  const isSelected = selectedRoles.includes(role.roleName);
                  return (
                    <div
                      key={role.roleId}
                      className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleToggle(role.roleName)}
                    >
                      <Checkbox
                        id={role.roleId}
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(role.roleName)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none">{role.roleName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateRoles.isPending}>
            {updateRoles.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Roles
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
