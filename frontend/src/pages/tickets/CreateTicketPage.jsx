import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SquarePen, ChevronLeft, Paperclip } from 'lucide-react';
import AttachmentUploader from '@/components/tickets/AttachmentUploader';
import TicketForm from '@/components/tickets/TicketForm';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isUser = user?.role === 'USER';
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
        setError('Invalid response from server (missing ticket id). Try again or check backend logs.');
        return;
      }
      const ticketId = typeof rawId === 'number' ? rawId : Number(rawId);
      if (!Number.isFinite(ticketId)) {
        setError('Invalid response from server (ticket id). Try again.');
        return;
      }
      if (files.length) {
        for (const file of files) {
          try {
            await ticketsApi.addAttachment(ticketId, file);
          } catch (attachErr) {
            setError(
              getApiErrorMessage(
                attachErr,
                'Ticket was created but an attachment failed. You can add images on the ticket page.'
              )
            );
            navigate(`/tickets/${ticketId}`, { replace: true });
            return;
          }
        }
      }
      navigate(`/tickets/${ticketId}`, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create ticket'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`mx-auto max-w-2xl space-y-6 relative ${isUser ? 'container py-10' : ''}`}>
      
      {isUser && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="ambient-orb orb-1"></div>
          <div className="ambient-orb orb-2"></div>
          <div className="ambient-orb orb-3"></div>
        </div>
      )}

      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-3">
          {isUser ? (
            <button className="btn btn-secondary flex items-center gap-2" type="button" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Back
            </Button>
          )}
          <h2 className={isUser ? "text-3xl font-bold tracking-tight gradient-text flex items-center gap-2" : "text-2xl font-semibold text-slate-900 dark:text-slate-50"}>
            {isUser && <SquarePen className="h-6 w-6 text-[var(--accent-color)]" />} Create ticket
          </h2>
        </div>
        
        {isUser ? (
          <div className="glass-panel glass-panel-hover overflow-visible relative z-10 bg-[rgba(10,10,15,0.6)] backdrop-blur-2xl">
            <div className="mb-6 border-b border-[var(--glass-border)] pb-4">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">New maintenance or incident request</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Provide clear details so staff can respond quickly.</p>
            </div>
            <div className="space-y-6">
              {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
              <TicketForm
                isUser={isUser}
                onSubmit={handleSubmit}
                submitLabel={submitting ? 'Submitting…' : 'Create ticket'}
                disabled={submitting}
                extraBelow={
                  <div className="glass-section mt-6">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-color)] mb-4 flex items-center gap-2">
                      <Paperclip className="h-4 w-4" /> Attachments
                    </h4>
                    <AttachmentUploader isUser={isUser} files={files} onChange={setFiles} disabled={submitting} />
                  </div>
                }
              />
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>New maintenance or incident request</CardTitle>
              <CardDescription>Provide clear details so staff can respond quickly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <TicketForm
                isUser={isUser}
                onSubmit={handleSubmit}
                submitLabel={submitting ? 'Submitting…' : 'Create ticket'}
                disabled={submitting}
                extraBelow={<AttachmentUploader isUser={isUser} files={files} onChange={setFiles} disabled={submitting} />}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
