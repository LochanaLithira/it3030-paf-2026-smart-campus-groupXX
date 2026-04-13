import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Plus, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBookings, useCancelBooking } from '@/hooks/useBookings';
import type { BookingResponse, BookingStatus } from '@/types/api';

const STATUS_OPTIONS: BookingStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

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

export function BookingListPage() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<BookingStatus | ''>('');

  const { data, isFetching, refetch } = useBookings({
    page,
    size: 20,
    status: status || undefined,
  });
  const cancel = useCancelBooking();

  const rows = useMemo(() => data?.content ?? [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">{data ? `${data.totalElements} booking(s)` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to="/bookings/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={status || '__all__'}
          onValueChange={(value) => {
            const next = value === '__all__' ? '' : (value as BookingStatus);
            setStatus(next);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
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
                <TableCell>{b.bookingDate}</TableCell>
                <TableCell>
                  {b.startTime} - {b.endTime}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link to="/bookings/$bookingId" params={{ bookingId: b.bookingId }}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    {(b.status === 'PENDING' || b.status === 'APPROVED') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => cancel.mutate(b.bookingId)}
                        disabled={cancel.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!rows.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No bookings found.
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

