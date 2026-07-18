import { Award, CupSoda, Gift, History } from 'lucide-react';
import { BottleChart, PointsChart } from '../components/charts/EcoCharts';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { useStudentData } from '../hooks/useStudentData';
import { formatDateTime } from '../lib/utils';

export default function StudentDashboard() {
  const { profile, bottles = [], coupons = [], monthly = [], loading, error } = useStudentData();
  const activeCoupons = coupons.filter((coupon) => coupon.status === 'ACTIVE').length;
  const hasBottleData = bottles.length > 0;

  if (loading) return <PageLoader />;
  if (error) return <EmptyState title="Unable to load dashboard" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Student Dashboard" description="Track recycling activity, points, and active rewards." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Award} label="Total Points" value={profile?.total_points ?? 0} helper="Available for coupon redemption" />
        <StatCard icon={CupSoda} label="Bottles Recycled" value={bottles.length} helper="All verified bottle insertions" />
        <StatCard icon={Gift} label="Available Coupons" value={activeCoupons} helper="Active coupons before expiry" />
        <StatCard icon={History} label="Recent Entries" value={bottles.slice(0, 7).length} helper="Latest recycling records" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface rounded-xl p-5">
          <h2 className="text-lg font-bold">Monthly Bottle Count</h2>
          <div className="mt-4">
            {hasBottleData ? <BottleChart data={monthly} /> : <InlineEmpty message="No bottles recycled yet." />}
          </div>
        </section>
        <section className="surface rounded-xl p-5">
          <h2 className="text-lg font-bold">Monthly Points Earned</h2>
          <div className="mt-4">
            {hasBottleData ? <PointsChart data={monthly} /> : <InlineEmpty message="Points will appear after your first bottle deposit." />}
          </div>
        </section>
      </div>

      <section className="surface overflow-hidden rounded-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-white/10">
          <h2 className="text-lg font-bold">Recent Activity</h2>
          <Badge tone="green">Live from bottles</Badge>
        </div>
        {hasBottleData ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Bottle Type</th>
                  <th className="px-4 py-3">Points Earned</th>
                </tr>
              </thead>
              <tbody>
                {bottles.slice(0, 6).map((item) => (
                  <tr key={item.id}>
                    <td className="table-cell">{formatDateTime(item.created_at)}</td>
                    <td className="table-cell">Type {item.bottle_type}</td>
                    <td className="table-cell font-semibold text-eco-700 dark:text-eco-300">+{item.points_awarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8">
            <InlineEmpty message="No bottle recycled yet. Once the ESP32 machine sends your first bottle record, it will show here." />
          </div>
        )}
      </section>
    </div>
  );
}

export function PageHeader({ title, description }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{title}</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">{description}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-80 items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-eco-200 border-t-eco-700" />
    </div>
  );
}

function InlineEmpty({ message }) {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
      {message}
    </div>
  );
}
