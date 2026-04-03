import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AssignmentPanel from '@/components/tickets/AssignmentPanel';
import AttachmentUploader from '@/components/tickets/AttachmentUploader';
import CommentSection from '@/components/tickets/CommentSection';
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const canStaffPanel = isAdmin || role === 'TECHNICIAN';

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('Invalid ticket link');
      setTicket(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await ticketsApi.getTicket(id);
      setTicket(res.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load ticket'));
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const attachments = ticket?.attachments ?? [];
  const canAddMore = attachments.length < 3;

  const canDeleteAttachment = (a) =>
    isAdmin ||
    (user?.id != null && a.uploadedById === user.id) ||
    (!!user?.name && a.uploadedByName?.trim() === user.name.trim());

  const handleUploadMore = async () => {
    if (!ticket || !uploadFiles.length) return;
    setUploadBusy(true);
    try {
      for (const file of uploadFiles) {
        await ticketsApi.addAttachment(ticket.id, file);
      }
      setUploadFiles([]);
      await load();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploadBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm text-slate-500">
        <span className="inline-block size-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
        Loading ticket…
      </div>
    );
  }
  if (error || !ticket) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm text-destructive">{error || 'Ticket not found'}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Go back
          </Button>
          {id ? (
            <Button type="button" onClick={() => load()}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
          Back
        </Button>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Ticket #{ticket.id}</h2>
        <TicketStatusBadge status={ticket.status} />
        <TicketPriorityBadge priority={ticket.priority} />
      </div>

      <div className={`grid gap-6 ${canStaffPanel ? 'lg:grid-cols-3' : ''}`}>
        <Card className={canStaffPanel ? 'lg:col-span-2' : ''}>
          <CardHeader>
            <CardTitle>{ticket.title}</CardTitle>
            <CardDescription>
              Category: <span className="font-medium text-foreground">{ticket.category}</span>
              {ticket.locationOrResource ? (
                <>
                  {' '}
                  · Location: <span className="font-medium text-foreground">{ticket.locationOrResource}</span>
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400">
                {ticket.description}
              </p>
            </div>
            {ticket.preferredContactDetails ? (
              <div>
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Contact</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ticket.preferredContactDetails}</p>
              </div>
            ) : null}
            <div className="text-xs text-slate-500">
              Reported by {ticket.createdByName} · Created {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}
              {ticket.assignedTechnicianName ? ` · Assigned: ${ticket.assignedTechnicianName}` : ''}
            </div>
            {ticket.status === 'REJECTED' && ticket.rejectionReason ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                <strong>Rejection reason:</strong> {ticket.rejectionReason}
              </div>
            ) : null}
            {ticket.resolutionNotes ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <strong>Resolution notes:</strong> {ticket.resolutionNotes}
              </div>
            ) : null}
          </CardContent>
        </Card>

        {canStaffPanel ? (
          <div className="space-y-4">
            <AssignmentPanel ticket={ticket} role={role} onUpdated={load} />
          </div>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attachments</CardTitle>
          <CardDescription>Images only; maximum 3 per ticket.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attachments.length === 0 ? (
            <p className="text-sm text-slate-500">No files attached.</p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
                >
                  <span className="font-medium text-slate-800 dark:text-slate-200">{a.fileName}</span>
                  <span className="text-xs text-slate-500">
                    {a.uploadedByName} · {a.uploadedAt ? new Date(a.uploadedAt).toLocaleString() : ''}
                  </span>
                  {canDeleteAttachment(a) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      type="button"
                      onClick={async () => {
                        if (!window.confirm('Remove this attachment?')) return;
                        try {
                          await ticketsApi.deleteAttachment(ticket.id, a.id);
                          await load();
                        } catch (err) {
                          alert(getApiErrorMessage(err, 'Delete failed'));
                        }
                      }}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canAddMore ? (
            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <AttachmentUploader files={uploadFiles} onChange={setUploadFiles} disabled={uploadBusy} idPrefix="det" />
              <Button
                className="mt-3"
                type="button"
                disabled={uploadBusy || uploadFiles.length === 0}
                onClick={handleUploadMore}
              >
                {uploadBusy ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CommentSection
        comments={ticket.comments ?? []}
        currentUserId={user?.id}
        currentUserName={user?.name}
        isAdmin={isAdmin}
        disabled={false}
        onAdd={async (message) => {
          try {
            await ticketsApi.addComment(ticket.id, { message });
            await load();
          } catch (err) {
            alert(getApiErrorMessage(err, 'Failed to add comment'));
          }
        }}
        onUpdate={async (commentId, message) => {
          try {
            await ticketsApi.updateComment(ticket.id, commentId, { message });
            await load();
          } catch (err) {
            alert(getApiErrorMessage(err, 'Failed to update comment'));
          }
        }}
        onDelete={async (commentId) => {
          try {
            await ticketsApi.deleteComment(ticket.id, commentId);
            await load();
          } catch (err) {
            alert(getApiErrorMessage(err, 'Failed to delete comment'));
          }
        }}
      />
    </div>
  );
}
