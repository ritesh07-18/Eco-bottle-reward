import { useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { redemptionOptions } from '../lib/constants';
import { formatCurrency, formatDateTime } from '../lib/utils';
import { redeemCoupon } from '../lib/ecobottleApi';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../hooks/useStudentData';
import { PageHeader, PageLoader } from './StudentDashboard';

export default function Redeem() {
  const { user } = useAuth();
  const { profile, loading, error, reload } = useStudentData();
  const [generated, setGenerated] = useState(null);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);

  async function handleRedeem(option) {
    setWorking(true);
    setMessage('');
    setGenerated(null);
    try {
      const coupon = await redeemCoupon({ userId: user?.id, points: option.points, discount: option.discount });
      setGenerated(coupon);
      await reload();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) return <PageLoader />;
  if (error) return <EmptyState title="Unable to load redemption page" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Redeem Points" description="Convert points into canteen discount coupons valid for 24 hours." />
      <section className="surface rounded-xl p-5">
        <p className="text-sm text-slate-500 dark:text-slate-400">Current points balance</p>
        <p className="mt-2 text-4xl font-bold text-slate-950 dark:text-white">{profile?.total_points ?? 0}</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {redemptionOptions.map((option) => {
          const disabled = working || (profile?.total_points ?? 0) < option.points;
          return (
            <div key={option.points} className="surface rounded-xl p-5">
              <div className="flex items-center justify-between">
                <Badge tone="green">{option.points} Points</Badge>
                <Gift className="text-eco-600" size={22} />
              </div>
              <p className="mt-5 text-3xl font-bold">{formatCurrency(option.discount)}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Canteen discount coupon</p>
              <button className="btn-primary mt-5 w-full" type="button" disabled={disabled} onClick={() => handleRedeem(option)}>
                Redeem
              </button>
            </div>
          );
        })}
      </div>

      {message && <p className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-200">{message}</p>}
      {generated && (
        <section className="rounded-xl border border-eco-200 bg-eco-50 p-6 dark:border-eco-900 dark:bg-eco-950/30">
          <div className="flex items-center gap-2 text-eco-800 dark:text-eco-100">
            <Sparkles size={20} />
            <h2 className="text-lg font-bold">Coupon generated</h2>
          </div>
          <p className="mt-4 text-4xl font-bold tracking-wide text-slate-950 dark:text-white">{generated.coupon_code}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {formatCurrency(generated.discount_value)} discount, expires {formatDateTime(generated.expiry_time)}
          </p>
        </section>
      )}
    </div>
  );
}
