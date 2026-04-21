import { Link } from '@tanstack/react-router';
import { useBookings } from '@/hooks/useBookings';
import { useTickets } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { CalendarRange, TicketPlus, CalendarDays, Ticket, ArrowRight, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function UserDashboard() {
  const { data: bookingsPage, isLoading: bookingsLoading } = useBookings({ status: 'APPROVED', size: 5 });
  const { data: ticketsPage, isLoading: ticketsLoading } = useTickets({ status: 'OPEN', size: 5 });

  const activeBookings = bookingsPage?.content || [];
  const openTickets = ticketsPage?.content || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* High-visibility Calls to Action */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link 
          to="/bookings/new" 
          className={buttonVariants({ size: "lg", className: "h-24 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 flex flex-col items-center justify-center gap-2 group transition-all" })}
        >
          <CalendarRange className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="text-lg font-medium">Book a Resource</span>
        </Link>
        <Link 
          to="/tickets/new" 
          className={buttonVariants({ size: "lg", variant: "outline", className: "h-24 border-border/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 group transition-all" })}
        >
          <TicketPlus className="h-6 w-6 text-muted-foreground group-hover:scale-110 transition-transform" />
          <span className="text-lg font-medium">Report an Issue</span>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Bookings Widget */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-500" />
              <div>
                <CardTitle className="text-lg">My Active Bookings</CardTitle>
                <CardDescription>Your approved upcoming sessions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border/50">
              {bookingsLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading bookings...</div>
              ) : activeBookings.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No upcoming bookings.
                </div>
              ) : (
                activeBookings.map((booking) => (
                  <div key={booking.bookingId} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{booking.purpose}</p>
                        <p className="text-xs text-muted-foreground mt-1">{booking.resource.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.bookingDate).toLocaleDateString()} at {booking.startTime.substring(0, 5)}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-indigo-600 border-indigo-600/30">APPROVED</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {activeBookings.length > 0 && (
            <div className="p-4 mt-auto border-t border-border/50 bg-muted/20">
              <Link to="/bookings" className={buttonVariants({ variant: "ghost", className: "w-full text-sm" })}>
                View all bookings
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          )}
        </Card>

        {/* Open Tickets Widget */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-rose-500" />
              <div>
                <CardTitle className="text-lg">My Open Tickets</CardTitle>
                <CardDescription>Your reported issues pending resolution</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <div className="divide-y divide-border/50">
              {ticketsLoading ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading tickets...</div>
              ) : openTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  No open issues currently.
                </div>
              ) : (
                openTickets.map((ticket) => (
                  <div key={ticket.ticketId} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <p className="font-medium text-sm line-clamp-1">{ticket.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{ticket.resource.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Reported {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-rose-600 border-rose-600/30 min-w-fit">OPEN</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
          {openTickets.length > 0 && (
            <div className="p-4 mt-auto border-t border-border/50 bg-muted/20">
              <Link to="/tickets" className={buttonVariants({ variant: "ghost", className: "w-full text-sm" })}>
                View all tickets
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </div>
          )}
        </Card>
      </div>

    </div>
  );
}
