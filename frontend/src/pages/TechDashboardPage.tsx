import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTickets, useUpdateTicketStatus } from '@/hooks/useTickets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Wrench,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type { TicketSummaryResponse, TicketStatus } from '@/types/api';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_CONFIG = {
  CRITICAL: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    order: 0,
  },
  HIGH: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle,
    order: 1,
  },
  MEDIUM: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    order: 2,
  },
  LOW: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    order: 3,
  },
};

const STATUS_CONFIG = {
  OPEN: { color: 'bg-gray-100 text-gray-800', label: 'Open' },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
  RESOLVED: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
  CLOSED: { color: 'bg-slate-100 text-slate-800', label: 'Closed' },
  REJECTED: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
};

export default function TechDashboardPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  
  // Fetch tickets assigned to current technician
  // Backend auto-scopes results to the logged-in technician's assigned tickets via JWT role
  const { data: ticketsPage, isLoading } = useTickets({
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const tickets = ticketsPage?.content ?? [];

  const updateStatus = useUpdateTicketStatus();

  // Group tickets by priority
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const priority = ticket.priority;
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(ticket);
    return acc;
  }, {} as Record<string, TicketSummaryResponse[]>);

  // Sort priority groups (CRITICAL first)
  const sortedPriorities = Object.keys(groupedTickets).sort(
    (a, b) => PRIORITY_CONFIG[a as keyof typeof PRIORITY_CONFIG].order - 
              PRIORITY_CONFIG[b as keyof typeof PRIORITY_CONFIG].order
  );

  // Quick status update actions
  const handleQuickStatusUpdate = async (
    ticketId: string,
    newStatus: TicketStatus,
    currentStatus: TicketStatus
  ) => {
    if (currentStatus === newStatus) return;

    updateStatus.mutate({
      ticketId,
      newStatus,
      note: `Status updated from ${currentStatus} to ${newStatus}`,
    });
  };

  // Stats calculation
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Assigned Tickets</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your assigned maintenance tickets
          </p>
        </div>
        <Wrench className="h-10 w-10 text-muted-foreground" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{stats.open}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Status:</span>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as TicketStatus | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tickets...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && tickets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">No tickets assigned</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === 'all'
                ? "You don't have any assigned tickets at the moment."
                : `No ${statusFilter.toLowerCase().replace('_', ' ')} tickets found.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped Tickets by Priority */}
      {!isLoading && sortedPriorities.map((priority) => {
        const priorityConfig = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
        const PriorityIcon = priorityConfig.icon;
        const priorityTickets = groupedTickets[priority];

        return (
          <div key={priority} className="space-y-3">
            {/* Priority Header */}
            <div className="flex items-center gap-2">
              <PriorityIcon className="h-5 w-5" />
              <h2 className="text-xl font-semibold">{priority} Priority</h2>
              <Badge variant="secondary">{priorityTickets.length}</Badge>
            </div>

            {/* Tickets in this priority */}
            <div className="grid grid-cols-1 gap-3">
              {priorityTickets.map((ticket) => {
                const statusConfig = STATUS_CONFIG[ticket.status];
                
                return (
                  <Card
                    key={ticket.ticketId}
                    className={`border-l-4 ${priorityConfig.color} hover:shadow-md transition-shadow cursor-pointer`}
                    onClick={() => navigate({ to: `/tickets/${ticket.ticketId}` })}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Ticket Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm text-muted-foreground">
                              #{ticket.ticketId.slice(0, 8)}
                            </span>
                            <Badge className={statusConfig?.color}>
                              {statusConfig?.label ?? ticket.status}
                            </Badge>
                            <Badge variant="outline">{ticket.category}</Badge>
                          </div>
                          
                          <p className="font-medium line-clamp-2">{ticket.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Resource: <span className="font-medium text-foreground">
                                {ticket.resource?.name ?? 'Unknown'}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              Created {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                            </span>
                            {ticket.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>

                        </div>

                        {/* Right: Quick Actions */}
                        <div className="flex flex-col gap-2">
                          {ticket.status === 'OPEN' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusUpdate(ticket.ticketId, 'IN_PROGRESS', ticket.status);
                              }}
                            >
                              Start Work
                            </Button>
                          )}
                          {ticket.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusUpdate(ticket.ticketId, 'RESOLVED', ticket.status);
                              }}
                            >
                              Mark Resolved
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate({ to: `/tickets/${ticket.ticketId}` });
                            }}
                          >
                            View Details
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
