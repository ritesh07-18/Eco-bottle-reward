import { useEffect, useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader, PageLoader } from './StudentDashboard';
import { getCanteenTransactions } from '../lib/ecobottleApi';
import { formatCurrency, formatDateTime } from '../lib/utils';

export default function CanteenTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await getCanteenTransactions();
        if (active) setTransactions(data ?? []);
      } catch (err) {
        if (active) setError(err.message ?? 'Unable to load transactions.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <EmptyState title="Unable to load transactions" message={error} />;

  const totalDiscount = transactions.reduce((sum, item) => sum + (item.discount_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Transaction History" description="Recent coupon redemptions verified by the canteen." />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="surface rounded-xl p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Redemptions recorded</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{transactions.length}</p>
        </div>
        <div className="surface rounded-xl p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Discount value issued</p>
          <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{formatCurrency(totalDiscount)}</p>
        </div>
      </div>
      <section className="surface overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Coupon Code</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id}>
                  <td className="table-cell">{formatDateTime(item.created_at)}</td>
                  <td className="table-cell font-semibold">{item.coupons?.coupon_code ?? '—'}</td>
                  <td className="table-cell">
                    <span className="block font-semibold">{item.coupons?.profiles?.name ?? 'Unknown'}</span>
                    {item.coupons?.profiles?.student_id && (
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {item.coupons.profiles.student_id}
                      </span>
                    )}
                  </td>
                  <td className="table-cell font-semibold text-eco-700 dark:text-eco-300">
                    {formatCurrency(item.discount_amount)}
                  </td>
                  <td className="table-cell">
                    <Badge tone="green">USED</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-8">
              <EmptyState title="No transactions yet" message="Verified coupon redemptions will appear here." />
            </div>
          )}
        </div>
      </section>
      <p className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <ReceiptText size={16} />
        Every verified coupon creates an auditable transaction record in the database.
      </p>
    </div>
  );
}
