import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateTicket } from '@/hooks/useTickets';
import { TicketForm, type TicketFormValues } from '@/components/tickets/TicketForm';

export function TicketCreatePage() {
  const navigate = useNavigate();
  const createTicket = useCreateTicket();

  const handleSubmit = async (values: TicketFormValues) => {
    try {
      const ticket = await createTicket.mutateAsync({
        resourceId: values.resourceId || undefined,
        locationId: values.locationId || undefined,
        category: values.category,
        priority: values.priority,
        description: values.description,
        preferredContactEmail: values.preferredContactEmail || undefined,
        preferredContactPhone: values.preferredContactPhone || undefined,
        dueDate: values.dueDate ? format(values.dueDate, 'yyyy-MM-dd') : undefined,
        attachments: values.attachments,
      });

      // Navigate to the created ticket
      navigate({ to: '/tickets/$ticketId', params: { ticketId: String(ticket.ticketId) } });
    } catch (error) {
      // Error is handled by the mutation's onError in useCreateTicket
      console.error('Failed to create ticket:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/tickets' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Ticket</CardTitle>
          <CardDescription>
            Report an issue or request maintenance for a resource
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketForm
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: '/tickets' })}
            isLoading={createTicket.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
