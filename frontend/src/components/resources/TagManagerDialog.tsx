import { useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateResourceTag,
  useDeleteResourceTag,
  useResourceTags,
  useUpdateResourceTag,
} from '@/hooks/useResources';
import type { ResourceTagResponse } from '@/types/api';

interface TagManagerDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TagManagerDialog({ open, onClose }: TagManagerDialogProps) {
  const { data: tags = [], isLoading } = useResourceTags();
  const createTag = useCreateResourceTag();
  const updateTag = useUpdateResourceTag();
  const deleteTag = useDeleteResourceTag();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEdit = (tag: ResourceTagResponse) => {
    setEditingId(tag.tagId);
    setEditName(tag.tagName);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const onCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createTag.mutate(
      { tagName: trimmed },
      {
        onSuccess: () => setNewName(''),
      },
    );
  };

  const onSaveEdit = (tagId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    updateTag.mutate(
      { tagId, request: { tagName: trimmed } },
      { onSuccess: () => cancelEdit() },
    );
  };

  const pending =
    createTag.isPending || updateTag.isPending || deleteTag.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-tag">New tag</Label>
            <div className="flex gap-2">
              <Input
                id="new-tag"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tag name"
                disabled={pending}
                onKeyDown={(e) => e.key === 'Enter' && onCreate()}
              />
              <Button type="button" onClick={onCreate} disabled={pending || !newName.trim()}>
                {createTag.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
            </div>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading tags...</p>
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags yet.</p>
            ) : (
              tags.map((tag) => (
                <div
                  key={tag.tagId}
                  className="flex items-center gap-2 rounded-sm border border-transparent px-1 py-1 hover:bg-muted/50"
                >
                  {editingId === tag.tagId ? (
                    <>
                      <Input
                        className="h-8 flex-1"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        disabled={pending}
                        onKeyDown={(e) => e.key === 'Enter' && onSaveEdit(tag.tagId)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => onSaveEdit(tag.tagId)}
                      >
                        Save
                      </Button>
                      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{tag.tagName}</span>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => startEdit(tag)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => deleteTag.mutate(tag.tagId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
