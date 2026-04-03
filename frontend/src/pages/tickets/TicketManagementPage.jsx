import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AssignmentPanel from '@/components/tickets/AssignmentPanel';
import TicketFilters from '@/components/tickets/TicketFilters';
import TicketTable from '@/components/tickets/TicketTable';
import { filterTicketsLocal } from '@/lib/ticketFilters';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

export default function TicketManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? 'USER';

  const [raw, setRaw] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');
  const [category, setCategory] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ticketsApi.listTickets({ page: 0, size: 100 });
      const content = res.data?.content ?? [];
      setRaw(content);
      setSelected((prev) => {
        if (!prev) return null;
        const still = content.find((t) => t.id === prev.id);
        return still ?? null;
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load tickets');
      setRaw([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => filterTicketsLocal(raw, { search, status, priority, category }),
    [raw, search, status, priority, category]
  );

  const title =
    role === 'TECHNICIAN' ? 'Assigned tickets' : 'All tickets';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Ticket management
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
        </div>
        <Button variant="outline" type="button" onClick={() => navigate('/tickets/new')}>
          Log new ticket
        </Button>
      </div>

      <TicketFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        category={category}
        onCategoryChange={setCategory}
        idPrefix="mgmt"
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Queue</CardTitle>
            <CardDescription>Select a ticket to assign or update status.</CardDescription>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <p className="text-sm text-destructive">{error}</p>
                <Button type="button" variant="outline" size="sm" onClick={() => load()}>
                  Retry
                </Button>
              </div>
            ) : null}
            {loading ? (
              <p className="text-sm text-slate-500">Loading tickets…</p>
            ) : (
              <TicketTable
                tickets={filtered}
                selectedId={selected?.id}
                onRowClick={(t) => setSelected(t)}
                emptyMessage={
                  raw.length === 0
                    ? 'No tickets in your queue.'
                    : 'No tickets match your filters.'
                }
              />
            )}
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">#{selected.id}</CardTitle>
                  <CardDescription className="line-clamp-2">{selected.title}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" type="button" onClick={() => navigate(`/tickets/${selected.id}`)}>
                    Open full detail
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setSelected(null)}>
                    Clear
                  </Button>
                </CardContent>
              </Card>
              <AssignmentPanel ticket={selected} role={role} onUpdated={load} />
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-slate-500">
                Select a ticket from the table to manage it here.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
