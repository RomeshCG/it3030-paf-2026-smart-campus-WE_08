import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
import { SquarePen, Paperclip } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

export default function TicketCreateSheet({
  triggerLabel = 'Create ticket',
  triggerVariant = 'default',
  triggerClassName,
  onCreated,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUser = user?.role === 'USER';
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
      <SheetContent 
        side="right" 
        className={isUser 
          ? "legacy-module w-full overflow-y-auto sm:max-w-2xl bg-[rgba(10,10,15,0.85)] backdrop-blur-2xl border-l border-[var(--glass-border)] text-[var(--text-primary)]" 
          : "w-full overflow-y-auto sm:max-w-2xl"}
      >
        {isUser && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="ambient-orb orb-1 opacity-30"></div>
            <div className="ambient-orb orb-2 top-[30%] opacity-30"></div>
            <div className="ambient-orb orb-3 opacity-30"></div>
          </div>
        )}

        <div className="relative z-10 px-1 sm:px-4 pb-6 pt-4">
          <SheetHeader className={isUser ? "border-b border-[var(--glass-border)] pb-5 mb-6 text-left" : "text-left"}>
            <SheetTitle className={isUser ? "gradient-text text-3xl font-bold tracking-tight flex items-center gap-2" : ""}>
               {isUser && <SquarePen className="h-6 w-6 text-[var(--accent-color)]" />} Create ticket
            </SheetTitle>
            <SheetDescription className={isUser ? "text-[var(--text-secondary)] mt-1" : ""}>
              Report a maintenance or incident issue without leaving this page.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 pt-2">
            {error ? <p className={isUser ? "text-sm text-[var(--danger)]" : "rounded-md bg-destructive/10 p-2 text-sm text-destructive"}>{error}</p> : null}
            <TicketForm
              isUser={isUser}
              onSubmit={handleSubmit}
              submitLabel={submitting ? 'Submitting...' : 'Create ticket'}
              disabled={submitting}
              extraBelow={
                <div className={isUser ? "glass-section mt-6" : ""}>
                  {isUser && <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)] mb-4 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" /> Attachments
                  </h4>}
                  <AttachmentUploader isUser={isUser} files={files} onChange={setFiles} disabled={submitting} />
                </div>
              }
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
