import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const VARIANTS = {
  OPEN: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  RESOLVED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  CLOSED: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  REJECTED: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
};

const LEGACY_VARIANTS = {
  OPEN: 'badge-glow-info',
  IN_PROGRESS: 'badge-glow-warning',
  RESOLVED: 'badge-glow-success',
  CLOSED: 'badge-glow-default',
  REJECTED: 'badge-glow-danger',
};

export default function TicketStatusBadge({ status, className, isUser }) {
  const label = status?.replace(/_/g, ' ') ?? '—';
  
  if (isUser) {
    return (
      <span className={cn('badge', LEGACY_VARIANTS[status] ?? 'badge-glow-default', className)}>
        {label}
      </span>
    );
  }

  return (
    <Badge variant="outline" className={cn('border-0 font-medium', VARIANTS[status] ?? '', className)}>
      {label}
    </Badge>
  );
}
