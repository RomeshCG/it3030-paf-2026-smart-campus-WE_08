import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, ListFilter } from 'lucide-react';
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
    <div className="space-y-6 container">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Ticket className="h-8 w-8 text-[var(--accent-color)]" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight gradient-text">My tickets</h2>
            <p className="text-[var(--text-secondary)]">Track requests you have submitted.</p>
          </div>
        </div>
        <TicketCreateSheet triggerLabel="Create ticket" onCreated={() => load()} triggerVariant="primary" triggerClassName="btn btn-primary" />
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

      <div className="glass-panel glass-panel-hover">
        <div className="mb-6 flex items-center gap-2 border-b border-[var(--glass-border)] pb-4">
          <ListFilter className="h-5 w-5 text-[var(--text-secondary)]" />
          <div>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">Your requests</h3>
            <p className="text-sm text-[var(--text-secondary)]">Filtered results update instantly.</p>
          </div>
        </div>
        <div>
          {error ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <p className="text-sm text-[var(--danger)]">{error}</p>
              <button type="button" className="btn btn-secondary" onClick={() => load()}>
                Retry
              </button>
            </div>
          ) : null}
          {loading ? (
            <div className="spinner mt-4" />
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
        </div>
      </div>
    </div>
  );
}
