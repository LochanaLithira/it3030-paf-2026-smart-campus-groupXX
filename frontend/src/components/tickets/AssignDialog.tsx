import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUsers } from '@/hooks/useUsers';
import { useAssignTicket } from '@/hooks/useTickets';

interface AssignDialogProps {
  ticketId: string;
  currentTechId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignDialog({
  ticketId,
  currentTechId,
  open,
  onOpenChange,
}: AssignDialogProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>(currentTechId || '');
  
  // Fetch users with TECHNICIAN role
  const { data: usersData, isLoading: usersLoading } = useUsers({
    role: 'TECHNICIAN',
    size: 100,
  });

  const assignTicket = useAssignTicket();

  const handleAssign = async () => {
    if (!selectedTechId) return;

    await assignTicket.mutateAsync({
      ticketId,
      technicianId: selectedTechId,
    });

    onOpenChange(false);
  };

  const technicians = usersData?.content || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Ticket</DialogTitle>
          <DialogDescription>
            Assign this ticket to a technician for resolution.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Technician</label>
            <Select value={selectedTechId} onValueChange={setSelectedTechId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                {usersLoading && (
                  <SelectItem value="" disabled>
                    Loading technicians...
                  </SelectItem>
                )}
                {technicians.length === 0 && !usersLoading && (
                  <SelectItem value="" disabled>
                    No technicians available
                  </SelectItem>
                )}
                {technicians.map((tech) => (
                  <SelectItem key={tech.userId} value={tech.userId}>
                    {tech.fullName} ({tech.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The selected technician will be notified and can update the ticket status.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTechId || assignTicket.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {assignTicket.isPending ? 'Assigning...' : 'Assign Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
