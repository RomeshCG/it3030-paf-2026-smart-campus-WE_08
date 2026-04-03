import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AttachmentUploader from '@/components/tickets/AttachmentUploader';
import TicketForm from '@/components/tickets/TicketForm';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

export default function CreateTicketPage() {
  const navigate = useNavigate();
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
          Back
        </Button>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Create ticket</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>New maintenance or incident request</CardTitle>
          <CardDescription>Provide clear details so staff can respond quickly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <TicketForm
            onSubmit={handleSubmit}
            submitLabel={submitting ? 'Submitting…' : 'Create ticket'}
            disabled={submitting}
            extraBelow={<AttachmentUploader files={files} onChange={setFiles} disabled={submitting} />}
          />
        </CardContent>
      </Card>
    </div>
  );
}
