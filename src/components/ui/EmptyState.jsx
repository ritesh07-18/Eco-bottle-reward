import { Leaf } from 'lucide-react';

export function EmptyState({ title, message }) {
  return (
    <div className="surface rounded-xl p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-eco-100 text-eco-700 dark:bg-eco-900/40 dark:text-eco-200">
        <Leaf size={22} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
