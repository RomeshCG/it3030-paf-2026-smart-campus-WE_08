import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TICKET_CATEGORY, TICKET_PRIORITY, TICKET_STATUS } from '@/services/ticketsApi';

export default function TicketFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  category,
  onCategoryChange,
  showCategory = true,
  idPrefix = 'tf',
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/40 md:flex-row md:flex-wrap md:items-end">
      <div className="min-w-[200px] flex-1">
        <Label htmlFor={`${idPrefix}-search`} className="text-xs text-slate-600 dark:text-slate-400">
          Search title
        </Label>
        <Input
          id={`${idPrefix}-search`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by title…"
          className="mt-1"
        />
      </div>
      {showCategory ? (
        <div className="w-full min-w-[140px] md:w-44">
          <Label htmlFor={`${idPrefix}-cat`} className="text-xs text-slate-600 dark:text-slate-400">
            Category
          </Label>
          <select
            id={`${idPrefix}-cat`}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="ALL">All categories</option>
            {TICKET_CATEGORY.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="w-full min-w-[140px] md:w-44">
        <Label htmlFor={`${idPrefix}-st`} className="text-xs text-slate-600 dark:text-slate-400">
          Status
        </Label>
        <select
          id={`${idPrefix}-st`}
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          {TICKET_STATUS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full min-w-[140px] md:w-44">
        <Label htmlFor={`${idPrefix}-pr`} className="text-xs text-slate-600 dark:text-slate-400">
          Priority
        </Label>
        <select
          id={`${idPrefix}-pr`}
          className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="ALL">All priorities</option>
          {TICKET_PRIORITY.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
