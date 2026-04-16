import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AttachmentUploader from '@/components/tickets/AttachmentUploader';
import TicketForm from '@/components/tickets/TicketForm';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

export default function TicketCreateSheet({
  triggerLabel = 'Create ticket',
  triggerVariant = 'default',
  triggerClassName,
  onCreated,
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (payload) => {
    setError('');
    setSubmitting(true);
    try {
      const res = await ticketsApi.createTicket(payload);
      const data = res?.data;
      const rawId = data?.id;
      if (rawId == null || rawId === '') {
        setError('Invalid response from server (missing ticket id). Try again.');
        return;
      }
      const ticketId = typeof rawId === 'number' ? rawId : Number(rawId);
      if (!Number.isFinite(ticketId)) {
        setError('Invalid response from server (ticket id). Try again.');
        return;
      }
      if (files.length) {
        for (const file of files) {
          await ticketsApi.addAttachment(ticketId, file);
        }
      }
      setOpen(false);
      setFiles([]);
      onCreated?.(ticketId);
      navigate(`/tickets/${ticketId}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create ticket'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError('');
          setFiles([]);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName}>
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Create ticket</SheetTitle>
          <SheetDescription>
            Report a maintenance or incident issue without leaving this page.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          {error ? <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">{error}</p> : null}
          <TicketForm
            onSubmit={handleSubmit}
            submitLabel={submitting ? 'Submitting...' : 'Create ticket'}
            disabled={submitting}
            extraBelow={<AttachmentUploader files={files} onChange={setFiles} disabled={submitting} />}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
