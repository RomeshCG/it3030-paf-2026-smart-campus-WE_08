import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const VARIANTS = {
  LOW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  MEDIUM: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200',
  HIGH: 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200',
};

export default function TicketPriorityBadge({ priority, className }) {
  return (
    <Badge variant="secondary" className={cn('font-medium', VARIANTS[priority] ?? '', className)}>
      {priority ?? '—'}
    </Badge>
  );
}
