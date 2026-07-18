import { Recycle } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-eco-600 text-white shadow-sm">
        <Recycle size={21} />
      </div>
      <div>
        <p className="text-base font-bold leading-5 text-slate-950 dark:text-white">EcoBottle</p>
        <p className="text-xs font-medium text-eco-700 dark:text-eco-300">Rewards System</p>
      </div>
    </div>
  );
}
