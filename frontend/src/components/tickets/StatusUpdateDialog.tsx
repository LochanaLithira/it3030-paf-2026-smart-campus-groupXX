import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Clock, CheckCircle, Ban, ArrowRight, MessageSquareX, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
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
import { cn } from '@/lib/utils';
import type { TicketStatus } from '@/types/api';

interface StatusUpdateDialogProps {
  ticketId: string;
  currentStatus: TicketStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; description: string; requireAdmin?: boolean; icon: any; color: string; bg: string }> = {
  OPEN: {
    label: 'Open',
    description: 'Ticket is waiting to be assigned or started',
    icon: AlertCircle,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    description: 'Work has started on this ticket',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
  },
  RESOLVED: {
    label: 'Resolved',
    description: 'Issue has been fixed, awaiting confirmation',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-100',
  },
  CLOSED: {
    label: 'Closed',
    description: 'Ticket is complete and verified',
    requireAdmin: true,
    icon: CheckCircle,
    color: 'text-gray-600',
    bg: 'bg-gray-100',
  },
  REJECTED: {
    label: 'Rejected',
    description: 'Ticket was rejected (requires notes)',
    requireAdmin: true,
    icon: Ban,
    color: 'text-red-600',
    bg: 'bg-red-100',
  },
};

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'REJECTED'],
  IN_PROGRESS: ['RESOLVED', 'REJECTED'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  REJECTED: [],
};

// Helper badge component
function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", config.color, config.bg)}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </div>
  );
}

export function StatusUpdateDialog({
  ticketId,
  currentStatus,
  open,
  onOpenChange,
}: StatusUpdateDialogProps) {
  const [newStatus, setNewStatus] = useState<TicketStatus>(currentStatus);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { isAdmin } = useAuthStore();
  const updateStatus = useUpdateTicketStatus();

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setNewStatus(currentStatus);
      setNotes('');
      setError(null);
    }
  }, [open, currentStatus]);

  const handleStatusChange = (status: TicketStatus) => {
    setNewStatus(status);
    setError(null);
  };

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (error) setError(null);
  };

  const handleUpdate = async () => {
    if (newStatus === currentStatus) {
      onOpenChange(false);
      return;
    }

    if (newStatus === 'REJECTED' && !notes.trim()) {
      setError('A rejection reason is required to reject this ticket.');
      return;
    }

    if (newStatus === 'RESOLVED' && !notes.trim()) {
      setError('Resolution notes are required to resolve this ticket.');
      return;
    }

    await updateStatus.mutateAsync({
      ticketId,
      newStatus,
      note: notes.trim(),
      resolutionNotes: newStatus === 'RESOLVED' ? notes.trim() : undefined,
    });

    onOpenChange(false);
  };

  const validStatuses = VALID_TRANSITIONS[currentStatus];
  const availableStatuses = (Object.keys(STATUS_CONFIG) as TicketStatus[]).filter(
    (status) =>
      (status === currentStatus || validStatuses.includes(status)) &&
      (!STATUS_CONFIG[status].requireAdmin || isAdmin())
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

        <div className="space-y-5 py-4">
          <div className="space-y-2.5">
            <label className="text-sm font-medium text-gray-700">New Status</label>
            <Select value={newStatus} onValueChange={(v) => handleStatusChange(v as TicketStatus)}>
              <SelectTrigger className="h-auto py-2.5">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = STATUS_CONFIG[newStatus].icon;
                      return <Icon className={cn("h-4 w-4", STATUS_CONFIG[newStatus].color)} />;
                    })()}
                    <span className="font-medium">{STATUS_CONFIG[newStatus].label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((status) => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  return (
                    <SelectItem
                      key={status}
                      value={status}
                      disabled={status === currentStatus}
                      className="py-2.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("mt-0.5 p-1.5 rounded-full", config.bg, config.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-medium text-sm">{config.label}</span>
                          <span className="text-xs text-muted-foreground whitespace-normal pr-4">
                            {config.description}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {newStatus !== currentStatus && (
            <div className="flex items-center justify-center gap-4 py-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current</span>
                <StatusBadge status={currentStatus} />
              </div>
              <ArrowRight className="h-5 w-5 text-gray-300" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">New</span>
                <StatusBadge status={newStatus} />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
              {newStatus === 'RESOLVED' ? 'Resolution Notes' : newStatus === 'REJECTED' ? 'Rejection Reason' : 'Notes'}
              {(newStatus === 'REJECTED' || newStatus === 'RESOLVED') && <span className="text-red-500">*</span>}
            </label>
            <Textarea
              placeholder={
                newStatus === 'REJECTED'
                  ? 'Please explain the reason for rejecting this ticket...'
                  : newStatus === 'RESOLVED'
                    ? 'Please describe how this issue was resolved...'
                    : 'Add any relevant updates or comments...'
              }
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className={cn(
                "min-h-[110px] resize-none focus-visible:ring-1",
                error ? "border-red-500 focus-visible:ring-red-500" : "focus-visible:ring-blue-500"
              )}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 mt-1.5 p-2 bg-red-50 rounded-md">
                {newStatus === 'REJECTED' ? <MessageSquareX className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {error}
              </div>
            )}
            {!error && (newStatus === 'REJECTED' || newStatus === 'RESOLVED') && (
              <p className="text-xs text-muted-foreground ml-1">
                {newStatus === 'RESOLVED' ? 'Resolution notes are required.' : 'A rejection reason is required.'}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={newStatus === currentStatus || updateStatus.isPending}
            className={cn(newStatus === 'RESOLVED' && "bg-green-600 hover:bg-green-700", newStatus === 'REJECTED' && "bg-red-600 hover:bg-red-700")}
          >
            {updateStatus.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : newStatus === 'RESOLVED' ? (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            ) : newStatus === 'REJECTED' ? (
              <Ban className="h-4 w-4 mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {updateStatus.isPending ? 'Updating...' : `Mark as ${STATUS_CONFIG[newStatus].label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
