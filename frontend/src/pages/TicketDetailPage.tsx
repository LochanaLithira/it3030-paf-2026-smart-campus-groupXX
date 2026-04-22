import { useParams, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useDeleteTicket, useTicketById, useDeleteTicketAttachment } from '@/hooks/useTickets';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  CommentThread,
  AssignDialog,
  StatusUpdateDialog,
  StatusTimeline,
  AttachmentUploader,
  SLATimerCard,
} from '@/components/tickets';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  User,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  Image as ImageIcon,
  Download,
  CheckCircle,
  Ban,
  UserPlus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import type { TicketStatus, TicketPriority } from '@/types/api';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

// Status badge (same as list page)
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

// Priority badge (same as list page)
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

export function TicketDetailPage() {
  const { ticketId } = useParams({ strict: false }) as { ticketId: string };
  const navigate = useNavigate();
  const { data: ticket, isLoading, error } = useTicketById(ticketId);
  const { user, hasPermission } = useAuthStore();
  const deleteTicket = useDeleteTicket();
  const deleteAttachment = useDeleteTicketAttachment();

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const canAssign = hasPermission(PERMISSIONS.TICKETS_ASSIGN);
  const canUpdateStatus = hasPermission(PERMISSIONS.TICKETS_UPDATE_STATUS);
  const canDelete = hasPermission(PERMISSIONS.TICKETS_DELETE);
  const isReporter = ticket?.reporter.userId === user?.userId;
  const isAssignedTech = ticket?.assignedTech?.userId === user?.userId;
  const canDeleteThisTicket = canDelete && (ticket?.status === 'OPEN' || ticket?.status === 'REJECTED');

  const handleDeleteTicket = async () => {
    if (!ticket || !canDeleteThisTicket) return;
    await deleteTicket.mutateAsync(ticket.ticketId);
    setDeleteConfirmOpen(false);
    navigate({ to: '/tickets' });
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!ticket) return;
    if (confirm('Are you sure you want to delete this attachment?')) {
      await deleteAttachment.mutateAsync({ ticketId: ticket.ticketId, attachmentId });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <AlertCircle className="h-12 w-12 mb-2 text-gray-300" />
          <p className="text-lg font-medium">Ticket not found</p>
          <Link to="/tickets">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/tickets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Ticket #{ticket.ticketId.slice(0, 8)}
              </h1>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
            <p className="text-sm text-gray-500">
              Created {format(new Date(ticket.createdAt), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canAssign && (
            <Button size="sm" variant="outline" onClick={() => setAssignDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              {ticket.assignedTech ? 'Reassign' : 'Assign'}
            </Button>
          )}
          {(canUpdateStatus || isAssignedTech) && ticket.status !== 'CLOSED' && (
            <Button size="sm" onClick={() => setStatusDialogOpen(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          )}
          {canDeleteThisTicket && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleteTicket.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Resource Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Resource
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <p className="text-base font-medium">{ticket.resource.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Type:</span>
                  <p className="text-base">{ticket.resource.type.replace('_', ' ')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Attachments ({ticket.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {ticket.attachments.map((attachment) => (
                    <div
                      key={attachment.attachmentId}
                      className="relative border rounded-lg overflow-hidden group"
                    >
                      <img
                        src={attachment.fileUrl}
                        alt={attachment.fileName}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <a
                          href={attachment.fileUrl}
                          download
                          className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-900" />
                        </a>
                        {((ticket.status === 'OPEN' && attachment.uploadedBy.userId === user?.userId) || 
                          (canDelete && ticket.status !== 'CLOSED')) && (
                          <button
                            onClick={() => handleDeleteAttachment(attachment.attachmentId)}
                            className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                            title="Delete Attachment"
                            disabled={deleteAttachment.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2">
                        <p className="text-xs font-medium truncate">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {(attachment.fileSize / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resolution History */}
          {ticket.statusHistory.some(h => h.newStatus === 'RESOLVED') && (
            <Card className="border-green-200 dark:border-green-900 shadow-sm overflow-hidden">
              <CardHeader className="bg-green-50/50 dark:bg-green-950/20 border-b border-green-100 dark:border-green-900/50">
                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  Resolution Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-green-100 dark:divide-green-900/50">
                  {ticket.statusHistory
                    .filter(h => h.newStatus === 'RESOLVED')
                    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                    .map((res, idx) => (
                      <div key={res.historyId} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                              {idx === 0 ? 'Latest Resolution' : `Previous Resolution #${ticket.statusHistory.filter(h => h.newStatus === 'RESOLVED').length - idx}`}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(res.changedAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                            <User className="h-3 w-3" />
                            {res.changedBy.fullName}
                          </div>
                        </div>
                        {res.notes || (res as any).note ? (
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                            {res.notes || (res as any).note}
                          </p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">No resolution notes provided.</p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({ticket.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentThread ticketId={ticket.ticketId} comments={ticket.comments} />
            </CardContent>
          </Card>

          {/* Attachments Upload Section */}
          {(isReporter || isAssignedTech || canAssign) && ticket.status === 'OPEN' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Add More Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentUploader
                  ticketId={ticket.ticketId}
                  currentAttachmentCount={ticket.attachments.length}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Category</span>
                <p className="text-sm mt-1">{ticket.category.replace('_', ' ')}</p>
              </div>

              <Separator />

              <div>
                <span className="text-sm font-medium text-gray-500">Reporter</span>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{ticket.reporter.fullName}</p>
                    <p className="text-xs text-gray-500">{ticket.reporter.email}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <span className="text-sm font-medium text-gray-500">Assigned To</span>
                {ticket.assignedTech ? (
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{ticket.assignedTech.fullName}</p>
                      <p className="text-xs text-gray-500">{ticket.assignedTech.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic mt-1">Unassigned</p>
                )}
              </div>

              {ticket.dueDate && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-gray-500">Due Date</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p
                        className={`text-sm ${new Date(ticket.dueDate) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-gray-700'
                          }`}
                      >
                        {format(new Date(ticket.dueDate), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {(ticket.preferredContactEmail || ticket.preferredContactPhone) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-500">Contact Information</span>
                    {ticket.preferredContactEmail && (
                      <p className="text-sm">
                        <span className="text-gray-600">Email:</span>{' '}
                        <a
                          href={`mailto:${ticket.preferredContactEmail}`}
                          className="text-blue-600 hover:underline"
                        >
                          {ticket.preferredContactEmail}
                        </a>
                      </p>
                    )}
                    {ticket.preferredContactPhone && (
                      <p className="text-sm">
                        <span className="text-gray-600">Phone:</span>{' '}
                        <a
                          href={`tel:${ticket.preferredContactPhone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {ticket.preferredContactPhone}
                        </a>
                      </p>
                    )}
                  </div>
                </>
              )}

              {ticket.resolvedAt && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-gray-500">Resolved At</span>
                    <p className="text-sm mt-1">
                      {format(new Date(ticket.resolvedAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* SLA Timers */}
          <SLATimerCard ticket={ticket} />

          {/* Status History - Using StatusTimeline Component */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline history={ticket.statusHistory} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <AssignDialog
        ticketId={ticket.ticketId}
        currentTechId={ticket.assignedTech?.userId}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />

      <StatusUpdateDialog
        ticketId={ticket.ticketId}
        currentStatus={ticket.status}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
      />

      {/* Delete Ticket Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        variant="danger"
        title="Delete Ticket"
        description={
          <>
            You are about to permanently delete{' '}
            <span className="font-semibold">Ticket #{ticket.ticketId.slice(0, 8)}</span>.
            {' '}This will remove all comments, attachments, and history.{' '}
            <span className="font-semibold">This action cannot be undone.</span>
          </>
        }
        confirmLabel="Delete Ticket"
        onConfirm={handleDeleteTicket}
        isPending={deleteTicket.isPending}
      />
    </div>
  );
}
