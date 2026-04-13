import { useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking, useCancelBooking } from '@/hooks/useBookings';
import type { BookingStatus } from '@/types/api';

function statusVariant(status: BookingStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    case 'CANCELLED':
      return 'outline';
  }
}

export function BookingDetailPage() {
  const { bookingId } = useParams({ strict: false }) as { bookingId: string };
  const { data, isLoading } = useBooking(bookingId);
  const cancel = useCancelBooking();

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading booking...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking Details</h1>
          <p className="text-muted-foreground">{data.bookingId}</p>
        </div>
        {(data.status === 'PENDING' || data.status === 'APPROVED') && (
          <Button variant="destructive" onClick={() => cancel.mutate(data.bookingId)} disabled={cancel.isPending}>
            Cancel Booking
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{data.resource.name}</span>
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{data.bookingDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="font-medium">
                {data.startTime} - {data.endTime}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expected attendees</p>
              <p className="font-medium">{data.expectedAttendees}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requested by</p>
              <p className="font-medium">{data.user.fullName}</p>
              <p className="text-sm text-muted-foreground">{data.user.email}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Purpose</p>
            <p className="font-medium whitespace-pre-wrap">{data.purpose}</p>
          </div>

          {data.status === 'REJECTED' && data.rejectionReason && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm font-medium text-destructive">Rejection reason</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

