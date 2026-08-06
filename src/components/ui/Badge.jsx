import { cn } from '../../lib/utils';

const styles = {
  green: 'bg-eco-100 text-eco-800 dark:bg-eco-900/40 dark:text-eco-200',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  slate: 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
};

export function Badge({ children, tone = 'slate' }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', styles[tone])}>
      {children}
    </span>
  );
}
