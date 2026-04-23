import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import TicketPriorityBadge from '@/components/tickets/TicketPriorityBadge';
import TicketStatusBadge from '@/components/tickets/TicketStatusBadge';

export default function TicketTable({
  tickets,
  onRowClick,
  selectedId,
  emptyMessage = 'No tickets match your filters.',
}) {
  const { user } = useAuth();
  const isUser = user?.role === 'USER';

  if (!tickets.length) {
    return (
      <div className={isUser ? "rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 bg-slate-50/50" : "rounded-lg border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500 dark:border-slate-800"}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={isUser ? "overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm" : "overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"}>
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className={isUser ? "border-b border-slate-100 bg-slate-50/50" : "border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/50"}>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>ID</th>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Title</th>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Category</th>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Assigned technician</th>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Priority</th>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Status</th>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`}>Updated</th>
            <th className={`px-4 py-3 font-semibold ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-700 dark:text-slate-300'}`} />
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              className={isUser 
                ? `border-b border-slate-100 transition-colors hover:bg-slate-50 ${selectedId != null && t.id === selectedId ? 'bg-blue-50' : ''}`
                : `border-b border-slate-100 transition-colors hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/40 ${selectedId != null && t.id === selectedId ? 'bg-sky-50/90 dark:bg-sky-950/30' : ''}`
              }
            >
              <td className={`px-4 py-3 font-mono text-xs ${isUser ? 'text-[var(--text-secondary)] opacity-70' : 'text-slate-500'}`}>#{t.id}</td>
              <td className="max-w-[240px] px-4 py-3">
                <span className={`line-clamp-2 font-medium ${isUser ? 'text-[var(--text-primary)]' : 'text-slate-900 dark:text-slate-100'}`}>{t.title}</span>
              </td>
              <td className={`px-4 py-3 ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-600 dark:text-slate-400'}`}>{t.category}</td>
              <td className="max-w-[220px] px-4 py-3">
                <span className={`line-clamp-1 ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-600 dark:text-slate-400'}`}>
                  {t.assignedTechnicianName || 'Unassigned'}
                </span>
              </td>
              <td className="px-4 py-3">
                <TicketPriorityBadge priority={t.priority} isUser={isUser} />
              </td>
              <td className="px-4 py-3">
                <TicketStatusBadge status={t.status} isUser={isUser} />
              </td>
              <td className={`whitespace-nowrap px-4 py-3 text-xs ${isUser ? 'text-[var(--text-secondary)]' : 'text-slate-500'}`}>
                {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                {isUser ? (
                  <button className="btn btn-secondary px-3 py-1 text-xs" type="button" onClick={() => onRowClick?.(t)}>
                    View
                  </button>
                ) : (
                  <Button variant="outline" size="sm" type="button" onClick={() => onRowClick?.(t)}>
                    View
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
