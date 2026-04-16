import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi, TICKET_STATUS } from '@/services/ticketsApi';

export default function AssignmentPanel({
  ticket,
  role,
  onUpdated,
  disabled = false,
}) {
  const [technicianId, setTechnicianId] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [status, setStatus] = useState(ticket?.status ?? 'OPEN');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [loadingTech, setLoadingTech] = useState(false);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isTechnician = role === 'TECHNICIAN';

  useEffect(() => {
    setStatus(ticket?.status ?? 'OPEN');
  }, [ticket?.status]);

  useEffect(() => {
    setResolutionNotes(ticket?.resolutionNotes ?? '');
  }, [ticket?.id, ticket?.resolutionNotes]);

  useEffect(() => {
    if (!ticket) {
      setTechnicianId('');
      return;
    }
    setTechnicianId(ticket.assignedTechnicianId ? String(ticket.assignedTechnicianId) : '');
  }, [ticket?.id, ticket?.assignedTechnicianId]);

  useEffect(() => {
    if (!isAdminRole) {
      setTechnicians([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingTech(true);
      try {
        const res = await ticketsApi.listTechnicians();
        if (!cancelled) setTechnicians(res.data ?? []);
      } catch {
        if (!cancelled) setTechnicians([]);
      } finally {
        if (!cancelled) setLoadingTech(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdminRole]);

  const run = async (fn) => {
    setActionError('');
    setBusy(true);
    try {
      await fn();
      await onUpdated?.();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Request failed'));
    } finally {
      setBusy(false);
    }
  };

  if (!ticket || (!isAdminRole && !isTechnician)) {
    return null;
  }

  const terminal = ticket.status === 'CLOSED' || ticket.status === 'REJECTED';

  return (
    <Card className="border-indigo-200/80 dark:border-indigo-900/50">
      <CardHeader>
        <CardTitle>{isTechnician ? 'Update ticket status' : 'Ticket management'}</CardTitle>
        <CardDescription>
          {isTechnician
            ? 'Move the ticket through the workflow when you are assigned.'
            : 'Assign technician, update workflow, or reject.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

        {isAdminRole ? (
        <div className="space-y-2">
          <Label>Assign technician</Label>
          <p className="text-xs text-slate-500">
            Current assignment: <span className="font-medium">{ticket.assignedTechnicianName || 'Unassigned'}</span>
          </p>
          <select
            className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            disabled={disabled || busy || terminal || loadingTech || technicians.length === 0}
          >
            <option value="">
              {loadingTech ? 'Loading technicians...' : technicians.length ? 'Select technician…' : 'No technicians available'}
            </option>
            {technicians.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          {loadingTech ? <p className="text-xs text-slate-500">Loading technicians…</p> : null}
          <Button
            type="button"
            disabled={
              disabled ||
              busy ||
              terminal ||
              !technicianId ||
              technicians.length === 0 ||
              String(ticket.assignedTechnicianId || '') === technicianId
            }
            onClick={() =>
              run(async () => {
                await ticketsApi.assignTechnician(ticket.id, {
                  technicianId: Number(technicianId),
                });
              })
            }
          >
            {ticket.assignedTechnicianId ? 'Reassign' : 'Assign'}
          </Button>
        </div>
        ) : null}

        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Label htmlFor="st-next">Next status</Label>
          <select
            id="st-next"
            className="flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={disabled || busy || terminal}
          >
            {TICKET_STATUS.filter((s) => s !== 'REJECTED').map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <div>
            <Label htmlFor="st-notes" className="text-xs text-slate-600 dark:text-slate-400">
              Work / resolution notes (optional, visible to requester)
            </Label>
            <textarea
              id="st-notes"
              rows={3}
              className="mt-1 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              disabled={disabled || busy || terminal}
              maxLength={4000}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled || busy || terminal || status === ticket.status}
            onClick={() =>
              run(async () => {
                await ticketsApi.updateStatus(ticket.id, {
                  status,
                  resolutionNotes: resolutionNotes.trim() || undefined,
                });
              })
            }
          >
            Update status
          </Button>
        </div>

        {isAdminRole ? (
        <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Label htmlFor="rej-reason">Reject ticket</Label>
          <textarea
            id="rej-reason"
            rows={2}
            placeholder="Reason (required)"
            className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            disabled={disabled || busy || terminal}
            maxLength={2000}
          />
          <Button
            type="button"
            variant="destructive"
            disabled={
              disabled ||
              busy ||
              terminal ||
              !(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') ||
              !rejectReason.trim()
            }
            onClick={() =>
              run(async () => {
                await ticketsApi.rejectTicket(ticket.id, { reason: rejectReason.trim() });
                setRejectReason('');
              })
            }
          >
            Reject ticket
          </Button>
        </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
