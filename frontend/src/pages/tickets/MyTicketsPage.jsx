import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TicketCreateSheet from '@/components/tickets/TicketCreateSheet';
import TicketFilters from '@/components/tickets/TicketFilters';
import TicketTable from '@/components/tickets/TicketTable';
import { filterTicketsLocal } from '@/lib/ticketFilters';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';
import { ticketsApi } from '@/services/ticketsApi';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState([]);
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
      const res = await ticketsApi.listMyTickets({ page: 0, size: 100 });
      setRaw(res.data?.content ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load tickets'));
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">My tickets</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Track requests you have submitted.</p>
        </div>
        <TicketCreateSheet triggerLabel="Create ticket" onCreated={() => load()} />
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
        idPrefix="my"
      />

      <Card>
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
          <CardDescription>Filtered results update instantly.</CardDescription>
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
              onRowClick={(t) => navigate(`/tickets/${t.id}`)}
              emptyMessage={
                raw.length === 0
                  ? 'No tickets yet. Create one to get started.'
                  : 'No tickets match your filters.'
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
