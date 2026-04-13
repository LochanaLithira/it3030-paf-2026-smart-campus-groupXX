import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useApproveBooking, useBookings, useRejectBooking } from '@/hooks/useBookings';
import type { BookingResponse, BookingStatus } from '@/types/api';

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

export function AdminBookingQueuePage() {
  const [page, setPage] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data, isFetching, refetch } = useBookings({
    page,
    size: 20,
    status: 'PENDING',
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  });

  const approve = useApproveBooking();
  const reject = useRejectBooking();

  const rows = useMemo(() => data?.content ?? [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking Approvals</h1>
          <p className="text-muted-foreground">{data ? `${data.totalElements} pending request(s)` : 'Loading...'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">From</Label>
          <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(0); }} />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">To</Label>
          <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(0); }} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((b: BookingResponse) => (
              <TableRow key={b.bookingId}>
                <TableCell className="font-medium">{b.resource.name}</TableCell>
                <TableCell>{b.user.fullName}</TableCell>
                <TableCell>{b.bookingDate}</TableCell>
                <TableCell>
                  {b.startTime} - {b.endTime}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => approve.mutate(b.bookingId)}
                      disabled={approve.isPending}
                    >
                      Approve
                    </Button>

                    <Dialog
                      open={rejectingId === b.bookingId}
                      onOpenChange={(open) => {
                        setRejectingId(open ? b.bookingId : null);
                        if (!open) setRejectionReason('');
                      }}
                    >
                      <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                        Reject
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject booking</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label>Reason</Label>
                          <Input value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
                        </div>
                        <DialogFooter>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              reject.mutate({ bookingId: b.bookingId, rejectionReason });
                              setRejectingId(null);
                              setRejectionReason('');
                            }}
                            disabled={!rejectionReason.trim() || reject.isPending}
                          >
                            Reject booking
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No pending bookings found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {data ? data.page + 1 : 1} / {data ? Math.max(1, data.totalPages) : 1}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || page >= data.totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

