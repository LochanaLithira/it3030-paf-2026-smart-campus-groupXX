import { useParams, Link } from '@tanstack/react-router';
import { useTicketById } from '@/hooks/useTickets';
import { useAuthStore } from '@/store/authStore';
import { PERMISSIONS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  XCircle,
  Ban,
} from 'lucide-react';
import { format } from 'date-fns';
import type { TicketStatus, TicketPriority } from '@/types/api';

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
  const { ticketId } = useParams({ from: '/tickets/$ticketId' });
  const { data: ticket, isLoading, error } = useTicketById(ticketId);
  const { user, hasPermission } = useAuthStore();

  const canAssign = hasPermission(PERMISSIONS.ASSIGN_TICKETS);
  const canUpdateStatus = hasPermission(PERMISSIONS.UPDATE_TICKET_STATUS);
  const canClose = hasPermission(PERMISSIONS.CLOSE_TICKETS);
  const isReporter = ticket?.reporter.userId === user?.userId;
  const isAssignedTech = ticket?.assignedTech?.userId === user?.userId;

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
          {canAssign && !ticket.assignedTech && (
            <Button size="sm" variant="outline">
              <User className="h-4 w-4 mr-2" />
              Assign Technician
            </Button>
          )}
          {(canUpdateStatus || isAssignedTech) && ticket.status !== 'CLOSED' && (
            <Button size="sm" variant="outline">
              Update Status
            </Button>
          )}
          {canClose && ticket.status === 'RESOLVED' && (
            <Button size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Close Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
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
                {ticket.resource.location && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location:</span>
                    <p className="text-base">
                      {ticket.resource.location.buildingName} - Floor{' '}
                      {ticket.resource.location.floorNumber}
                      {ticket.resource.location.roomNumber &&
                        `, Room ${ticket.resource.location.roomNumber}`}
                    </p>
                  </div>
                )}
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
                          className="p-2 bg-white rounded-full"
                        >
                          <Download className="h-5 w-5 text-gray-900" />
                        </a>
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

          {/* Resolution Notes */}
          {ticket.resolutionNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resolution Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.resolutionNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments ({ticket.comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div key={comment.commentId} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{comment.author.fullName}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </span>
                          {comment.createdAt !== comment.updatedAt && (
                            <span className="text-xs text-gray-400 italic">(edited)</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Button */}
              {(isReporter || isAssignedTech || hasPermission(PERMISSIONS.VIEW_ALL_TICKETS)) && (
                <div className="mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
                        className={`text-sm ${
                          new Date(ticket.dueDate) < new Date()
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

              {ticket.preferredContactDetails && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm font-medium text-gray-500">Contact Details</span>
                    <p className="text-sm mt-1">{ticket.preferredContactDetails}</p>
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

          {/* Status History */}
          {ticket.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.statusHistory.map((history, idx) => (
                    <div key={history.historyId} className="relative">
                      {idx !== ticket.statusHistory.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="flex gap-3">
                        <div className="relative z-10 mt-1">
                          <div className="h-4 w-4 rounded-full border-2 border-blue-500 bg-white" />
                        </div>
                        <div className="flex-1 pb-3">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(history.newStatus)}
                            <span className="text-xs text-gray-500">
                              {format(new Date(history.changedAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            by {history.changedBy.fullName}
                          </p>
                          {history.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">"{history.notes}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
