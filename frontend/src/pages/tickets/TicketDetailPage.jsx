import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Info, User, CalendarClock, Paperclip, MessageSquare } from 'lucide-react';
import AssignmentPanel from '@/components/tickets/AssignmentPanel';
import AttachmentUploader from '@/components/tickets/AttachmentUploader';
import CommentSection from '@/components/tickets/CommentSection';
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

function formatContactMethod(method) {
  if (!method) return 'Not specified';
  return method.replace('_', ' ');
}

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role ?? 'USER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const canStaffPanel = isAdmin || role === 'TECHNICIAN';
  const isUser = role === 'USER';

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
      <div className={isUser ? "glass-panel space-y-4" : "space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-6 dark:border-slate-800 dark:bg-slate-900/40"}>
        <p className={`text-sm ${isUser ? 'text-[var(--danger)]' : 'text-destructive'}`}>{error || 'Ticket not found'}</p>
        <div className="flex flex-wrap gap-2">
          {isUser ? (
            <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
              Go back
            </button>
          ) : (
            <Button variant="outline" type="button" onClick={() => navigate(-1)}>
              Go back
            </Button>
          )}
          {id ? (
            isUser ? (
              <button className="btn btn-primary" type="button" onClick={() => load()}>
                Retry
              </button>
            ) : (
              <Button type="button" onClick={() => load()}>
                Retry
              </Button>
            )
          ) : null}
        </div>
      </div>
    );
  }

  const renderCardContent = () => (
    <div className="space-y-4">
      <div>
        <h3 className={`text-sm font-medium ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Description</h3>
        <p className={`mt-1 whitespace-pre-wrap text-sm ${isUser ? 'text-[var(--text-primary)]' : 'text-slate-600 dark:text-slate-400'}`}>
          {ticket.description}
        </p>
      </div>
      {ticket.preferredContactDetails ? (
        <div>
          <h3 className={`text-sm font-medium ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Contact</h3>
          <p className={`mt-1 text-sm ${isUser ? 'text-[var(--text-primary)]' : 'text-slate-600 dark:text-slate-400'}`}>
            Method: {formatContactMethod(ticket.preferredContactMethod)}
          </p>
          <p className={`text-sm ${isUser ? 'text-[var(--text-primary)]' : 'text-slate-600 dark:text-slate-400'}`}>{ticket.preferredContactDetails}</p>
        </div>
      ) : ticket.preferredContactMethod ? (
        <div>
          <h3 className={`text-sm font-medium ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Contact</h3>
          <p className={`mt-1 text-sm ${isUser ? 'text-[var(--text-primary)]' : 'text-slate-600 dark:text-slate-400'}`}>
            Method: {formatContactMethod(ticket.preferredContactMethod)}
          </p>
        </div>
      ) : null}
      <div className={`text-xs mt-4 pt-4 flex flex-wrap items-center gap-2 ${isUser ? 'border-t border-[var(--glass-border)] text-[var(--text-secondary)] opacity-80' : 'border-t border-slate-100 text-slate-500 pt-3 mt-3 dark:border-slate-800'}`}>
        <User className="h-3.5 w-3.5" />
        <span>Reported by {ticket.createdByName}</span>
        <span className="opacity-50 px-1">•</span>
        <CalendarClock className="h-3.5 w-3.5" />
        <span>Created {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}</span>
        {ticket.assignedTechnicianName ? (
           <>
             <span className="opacity-50 px-1">•</span>
             <span>Assigned: {ticket.assignedTechnicianName}</span>
           </>
        ) : null}
      </div>
      {ticket.status === 'REJECTED' && ticket.rejectionReason ? (
        <div className={`rounded-lg border p-3 text-sm ${isUser ? 'bg-[rgba(239,68,68,0.1)] border-[var(--danger)] text-white' : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200'}`}>
          <strong>Rejection reason:</strong> {ticket.rejectionReason}
        </div>
      ) : null}
      {ticket.resolutionNotes ? (
        <div className={`rounded-lg border p-3 text-sm ${isUser ? 'bg-[rgba(16,185,129,0.1)] border-[var(--success)] text-white' : 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>
          <strong>Resolution notes:</strong> {ticket.resolutionNotes}
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={`space-y-6 ${isUser ? 'container' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        {isUser ? (
          <button className="btn btn-secondary flex items-center gap-2" type="button" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
            Back
          </Button>
        )}
        <h2 className={isUser ? "text-3xl font-bold tracking-tight gradient-text" : "text-2xl font-semibold text-slate-900 dark:text-slate-50"}>Ticket #{ticket.id}</h2>
        <TicketStatusBadge status={ticket.status} isUser={isUser} />
        <TicketPriorityBadge priority={ticket.priority} isUser={isUser} />
      </div>

      <div className={`grid items-start gap-6 ${canStaffPanel ? 'lg:grid-cols-3' : ''}`}>
        {isUser ? (
          <div className="glass-panel glass-panel-hover lg:col-span-2">
            <div className="mb-6 border-b border-[var(--glass-border)] pb-5">
              <h3 className="card-title text-[var(--text-primary)] flex items-center gap-2 text-2xl">
                <Info className="h-6 w-6 text-[var(--accent-color)]" />
                {ticket.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Category: <span className="font-medium text-[var(--text-primary)]">{ticket.category}</span>
                {ticket.locationOrResource ? (
                  <>
                    <span className="opacity-50 px-2">•</span>
                    Location: <span className="font-medium text-[var(--text-primary)]">{ticket.locationOrResource}</span>
                  </>
                ) : null}
              </p>
            </div>
            {renderCardContent()}
          </div>
        ) : (
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
              {renderCardContent()}
            </CardContent>
          </Card>
        )}

        {canStaffPanel ? (
          <div className="space-y-4">
            <AssignmentPanel ticket={ticket} role={role} onUpdated={load} />
          </div>
        ) : null}
      </div>

      {isUser ? (
        <div className="glass-panel glass-panel-hover">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--glass-border)] pb-4 gap-4">
            <div className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-[var(--text-secondary)]" />
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] m-0">Attachments</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Images only; maximum 3 per ticket.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {attachments.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No files attached.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--glass-border)] px-3 py-2 text-sm bg-[rgba(0,0,0,0.2)]"
                  >
                    <div className="flex items-center gap-3">
                      {isHttpUrl(a.filePath) ? (
                        <a href={a.filePath} target="_blank" rel="noreferrer">
                          <img
                            src={a.filePath}
                            alt={a.fileName}
                            className="h-12 w-12 rounded-md border border-[var(--glass-border)] object-cover"
                          />
                        </a>
                      ) : null}
                      <div className="space-y-0.5">
                        <p className="font-medium text-[var(--text-primary)]">{a.fileName}</p>
                        {isHttpUrl(a.filePath) ? (
                          <a
                            href={a.filePath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[var(--accent-color)] hover:underline"
                          >
                            View image
                          </a>
                        ) : (
                          <p className="text-xs text-[#f59e0b]">
                            Legacy file path; re-upload to make it viewable online.
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {a.uploadedByName} · {a.uploadedAt ? new Date(a.uploadedAt).toLocaleString() : ''}
                    </span>
                    {canDeleteAttachment(a) ? (
                      <button
                        className="btn btn-secondary text-xs border-none hover:text-[var(--danger)] text-[#ef4444]"
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
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {canAddMore ? (
              <div className="border-t border-[var(--border-color)] pt-4">
                <AttachmentUploader isUser={isUser} files={uploadFiles} onChange={setUploadFiles} disabled={uploadBusy} idPrefix="det" />
                <button
                  className="btn btn-primary mt-3"
                  type="button"
                  disabled={uploadBusy || uploadFiles.length === 0}
                  onClick={handleUploadMore}
                >
                  {uploadBusy ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
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
                    <div className="flex items-center gap-3">
                      {isHttpUrl(a.filePath) ? (
                        <a href={a.filePath} target="_blank" rel="noreferrer">
                          <img
                            src={a.filePath}
                            alt={a.fileName}
                            className="h-12 w-12 rounded-md border border-slate-200 object-cover dark:border-slate-700"
                          />
                        </a>
                      ) : null}
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{a.fileName}</p>
                        {isHttpUrl(a.filePath) ? (
                          <a
                            href={a.filePath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            View image
                          </a>
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            Legacy file path; re-upload to make it viewable online.
                          </p>
                        )}
                      </div>
                    </div>
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
                <AttachmentUploader isUser={isUser} files={uploadFiles} onChange={setUploadFiles} disabled={uploadBusy} idPrefix="det" />
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
      )}

      {isUser ? (
        <div className="glass-panel glass-panel-hover overflow-hidden" id="comments">
          <div className="flex items-center gap-2 border-b border-[var(--glass-border)] pb-4 mb-5">
            <MessageSquare className="h-5 w-5 text-[var(--accent-color)]" />
            <h3 className="card-title text-[var(--text-primary)] m-0">Comments</h3>
          </div>
          <CommentSection
            comments={ticket.comments ?? []}
            currentUserId={user?.id}
            currentUserName={user?.name}
            isAdmin={isAdmin}
            disabled={false}
            isUser={isUser}
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
      ) : (
        <Card>
           <CardHeader>
             <CardTitle>Comments</CardTitle>
             <CardDescription>Communicate with staff directly.</CardDescription>
           </CardHeader>
           <CardContent>
             <CommentSection
               comments={ticket.comments ?? []}
               currentUserId={user?.id}
               currentUserName={user?.name}
               isAdmin={isAdmin}
               disabled={false}
               isUser={isUser}
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
           </CardContent>
         </Card>
      )}
    </div>
  );
}
