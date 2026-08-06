import { createElement } from 'react';

export function StatCard({ icon, label, value, helper }) {
  return (
    <div className="surface rounded-xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-eco-100 text-eco-700 dark:bg-eco-900/40 dark:text-eco-200">
          {createElement(icon, { size: 22 })}
        </div>
      </div>
      {helper && <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{helper}</p>}
    </div>
  );
}
