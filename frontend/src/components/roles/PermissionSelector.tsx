import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PERMISSION_GROUPS, getAllPermissionValues } from '@/lib/permissions';
import { cn } from '@/lib/utils';

interface PermissionSelectorProps {
  selected: string[];
  onChange: (permissions: string[]) => void;
  readOnly?: boolean;
}

export function PermissionSelector({ selected, onChange, readOnly = false }: PermissionSelectorProps) {
  const allPerms = getAllPermissionValues();

  const isGroupFullySelected = (groupPerms: readonly { key: string }[]) =>
    groupPerms.every((p) => selected.includes(p.key));

  const isGroupPartiallySelected = (groupPerms: readonly { key: string }[]) =>
    groupPerms.some((p) => selected.includes(p.key)) && !isGroupFullySelected(groupPerms);

  const togglePermission = (key: string) => {
    if (readOnly) return;
    if (selected.includes(key)) {
      onChange(selected.filter((p) => p !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const toggleGroup = (groupPerms: readonly { key: string }[]) => {
    if (readOnly) return;
    const allSelected = isGroupFullySelected(groupPerms);
    if (allSelected) {
      // Deselect all in group
      onChange(selected.filter((p) => !groupPerms.some((gp) => gp.key === p)));
    } else {
      // Select all in group
      const toAdd = groupPerms.map((p) => p.key).filter((k) => !selected.includes(k));
      onChange([...selected, ...toAdd]);
    }
  };

  const toggleAll = () => {
    if (readOnly) return;
    if (selected.length === allPerms.length) {
      onChange([]);
    } else {
      onChange(allPerms);
    }
  };

  return (
    <div className="space-y-3">
      {/* Select all toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="select-all"
            checked={selected.length === allPerms.length}
            onCheckedChange={toggleAll}
            disabled={readOnly}
            ref={(el) => {
              if (el) el.dataset.indeterminate = String(
                selected.length > 0 && selected.length < allPerms.length
              );
            }}
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            Select All Permissions
          </label>
        </div>
        <Badge variant="outline">{selected.length} / {allPerms.length}</Badge>
      </div>

      {/* Groups */}
      <ScrollArea className="h-[480px] pr-3">
        <div className="space-y-4">
          {PERMISSION_GROUPS.map((group) => {
            const groupPerms = group.permissions;
            const fullySelected = isGroupFullySelected(groupPerms);
            const partiallySelected = isGroupPartiallySelected(groupPerms);

            return (
              <div key={group.id} className="rounded-lg border p-3 space-y-2">
                {/* Group header */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={fullySelected}
                    // Indeterminate state handled via className trick
                    className={cn(partiallySelected && 'opacity-60')}
                    onCheckedChange={() => toggleGroup(groupPerms)}
                    disabled={readOnly}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`group-${group.id}`}
                      className="text-sm font-semibold cursor-pointer"
                    >
                      {group.label}
                    </label>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </div>
                  <Badge variant={fullySelected ? 'default' : partiallySelected ? 'secondary' : 'outline'} className="text-xs shrink-0">
                    {groupPerms.filter((p) => selected.includes(p.key)).length}/{groupPerms.length}
                  </Badge>
                </div>

                {/* Individual permissions */}
                <div className="ml-6 grid grid-cols-1 gap-1.5">
                  {groupPerms.map((perm) => {
                    const isChecked = selected.includes(perm.key);
                    return (
                      <div
                        key={perm.key}
                        className={cn(
                          'flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors',
                          !readOnly && 'cursor-pointer hover:bg-accent',
                          isChecked && 'bg-accent/50'
                        )}
                        onClick={() => togglePermission(perm.key)}
                      >
                        <Checkbox
                          id={perm.key}
                          checked={isChecked}
                          onCheckedChange={() => togglePermission(perm.key)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={readOnly}
                          className="mt-0.5"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight">{perm.label}</p>
                          <p className="text-xs text-muted-foreground leading-tight">{perm.description}</p>
                          <code className="text-[10px] text-muted-foreground font-mono">{perm.key}</code>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
