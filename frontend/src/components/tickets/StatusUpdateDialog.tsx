import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useUpdateTicketStatus } from '@/hooks/useTickets';
import type { TicketStatus } from '@/types/api';

interface StatusUpdateDialogProps {
  ticketId: string;
  currentStatus: TicketStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: { value: TicketStatus; label: string; description: string }[] = [
  {
    value: 'OPEN',
    label: 'Open',
    description: 'Ticket is waiting to be assigned or started',
  },
  {
    value: 'IN_PROGRESS',
    label: 'In Progress',
    description: 'Work has started on this ticket',
  },
  {
    value: 'RESOLVED',
    label: 'Resolved',
    description: 'Issue has been fixed, awaiting confirmation',
  },
  {
    value: 'CLOSED',
    label: 'Closed',
    description: 'Ticket is complete and verified',
  },
  {
    value: 'REJECTED',
    label: 'Rejected',
    description: 'Ticket was rejected (requires notes)',
  },
];

// Valid state transitions
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED', 'CLOSED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  REJECTED: [],
};

export function StatusUpdateDialog({
  ticketId,
  currentStatus,
  open,
  onOpenChange,
}: StatusUpdateDialogProps) {
  const [newStatus, setNewStatus] = useState<TicketStatus>(currentStatus);
  const [notes, setNotes] = useState('');

  const updateStatus = useUpdateTicketStatus();

  const handleUpdate = async () => {
    if (newStatus === currentStatus) {
      onOpenChange(false);
      return;
    }

    // Require notes for REJECTED status
    if (newStatus === 'REJECTED' && !notes.trim()) {
      alert('Please provide a reason for rejecting this ticket.');
      return;
    }

    await updateStatus.mutateAsync({
      ticketId,
      status: newStatus,
      notes: notes.trim() || undefined,
    });

    onOpenChange(false);
    setNotes('');
  };

  const validStatuses = VALID_TRANSITIONS[currentStatus];
  const availableStatuses = STATUS_OPTIONS.filter(
    (option) => option.value === currentStatus || validStatuses.includes(option.value)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Ticket Status</DialogTitle>
          <DialogDescription>
            Change the status of this ticket and add optional notes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TicketStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value === currentStatus}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Notes {newStatus === 'REJECTED' && <span className="text-destructive">*</span>}
            </label>
            <Textarea
              placeholder={
                newStatus === 'REJECTED'
                  ? 'Explain why this ticket is being rejected...'
                  : 'Add any notes about this status change...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none"
            />
            {newStatus === 'REJECTED' && (
              <p className="text-xs text-muted-foreground">
                A rejection reason is required.
              </p>
            )}
          </div>

          {/* State Transition Info */}
          {newStatus !== currentStatus && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm">
                <span className="font-medium">{currentStatus}</span>
                {' → '}
                <span className="font-medium">{newStatus}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {STATUS_OPTIONS.find((s) => s.value === newStatus)?.description}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={newStatus === currentStatus || updateStatus.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {updateStatus.isPending ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
