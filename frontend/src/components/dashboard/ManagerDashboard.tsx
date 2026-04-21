import { Link } from '@tanstack/react-router';
import { useBookings } from '@/hooks/useBookings';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { CalendarDays, Ticket, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function ManagerDashboard() {
  const { data: bookingsPage, isLoading: bookingsLoading } = useBookings({ status: 'PENDING', size: 5 });
  const { data: ticketsPage, isLoading: ticketsLoading } = useTickets({ status: 'OPEN', size: 5 });

  const pendingBookings = bookingsPage?.content || [];
  const openTickets = ticketsPage?.content || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Manager Operations</h2>
        <p className="text-muted-foreground">Monitor and process pending requests and tickets.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Bookings Queue */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-md">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pending Bookings</CardTitle>
                  <CardDescription>Waiting for managerial approval</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                {bookingsLoading ? '...' : bookingsPage?.totalElements || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border/50">
              {bookingsLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading bookings...</div>
              ) : pendingBookings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No pending bookings in queue.
                </div>
              ) : (
                pendingBookings.map((booking) => (
                  <div key={booking.bookingId} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-sm leading-none">{booking.purpose}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.user.fullName} • {booking.resource.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.bookingDate).toLocaleDateString()} at {booking.startTime.substring(0, 5)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-amber-600 border-amber-600/30">PENDING</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <div className="p-4 mt-auto border-t border-border/50 bg-muted/20">
            <Link to="/admin/bookings" className={buttonVariants({ className: "w-full" })}>
              Open Booking Queue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </Card>

        {/* Unassigned / Open Tickets Queue */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-md">
                  <Ticket className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Open Tickets</CardTitle>
                  <CardDescription>Unresolved facility and IT issues</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400">
                {ticketsLoading ? '...' : ticketsPage?.totalElements || 0}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border/50">
              {ticketsLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading tickets...</div>
              ) : openTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No open tickets in queue.
                </div>
              ) : (
                openTickets.map((ticket) => (
                  <div key={ticket.ticketId} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 pr-4">
                        <p className="font-medium text-sm leading-none line-clamp-1">{ticket.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Priority: {ticket.priority} • Resource: {ticket.resource.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reported {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-rose-600 border-rose-600/30 whitespace-nowrap">OPEN</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          <div className="p-4 mt-auto border-t border-border/50 bg-muted/20">
            <Link to="/tickets" search={{ status: 'OPEN' }} className={buttonVariants({ variant: "outline", className: "w-full" })}>
              Open Ticket Queue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
