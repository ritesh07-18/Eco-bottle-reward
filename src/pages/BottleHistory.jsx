import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader, PageLoader } from './StudentDashboard';
import { useStudentData } from '../hooks/useStudentData';
import { formatDateTime } from '../lib/utils';

export default function BottleHistory() {
  const { bottles = [], loading, error } = useStudentData();
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');

  const filtered = useMemo(() => {
    return bottles.filter((item) => {
      const matchesType = type === 'ALL' || item.bottle_type === type;
      const haystack = `${item.machine_id} ${item.bottle_type} ${item.points_awarded}`.toLowerCase();
      return matchesType && haystack.includes(search.toLowerCase());
    });
  }, [bottles, search, type]);

  if (loading) return <PageLoader />;
  if (error) return <EmptyState title="Unable to load bottle history" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Bottle History" description="Search and filter every verified bottle insertion." />
      <section className="surface rounded-xl p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input className="input pl-10" placeholder="Search by machine, type, or points" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ALL">All bottle types</option>
            <option value="A">Type A</option>
            <option value="B">Type B</option>
            <option value="C">Type C</option>
          </select>
        </div>
      </section>
      <section className="surface overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Bottle Type</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Machine ID</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell">{formatDateTime(item.created_at)}</td>
                  <td className="table-cell">Type {item.bottle_type}</td>
                  <td className="table-cell font-semibold text-eco-700 dark:text-eco-300">+{item.points_awarded}</td>
                  <td className="table-cell">{item.machine_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState title="No bottle records found" message="Try changing the search or filter." />}
        </div>
      </section>
    </div>
  );
}
