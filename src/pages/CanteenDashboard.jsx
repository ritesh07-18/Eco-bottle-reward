import { useState } from 'react';
import { CheckCircle2, Search, XCircle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from './StudentDashboard';
import { findCoupon, markCouponUsed, verifyCoupon } from '../lib/ecobottleApi';
import { formatCurrency, formatDateTime } from '../lib/utils';

export default function CanteenDashboard() {
  const [code, setCode] = useState('DISC-4821');
  const [coupon, setCoupon] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function searchCoupon(event) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const data = await findCoupon(code.trim());
      setCoupon(data);
      if (!data) setResult({ valid: false, message: 'Coupon not found.' });
    } catch (err) {
      setResult({ valid: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setLoading(true);
    try {
      const data = await verifyCoupon(code.trim());
      setResult(data);
      if (data.coupon) setCoupon(data.coupon);
    } catch (err) {
      setResult({ valid: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleUse() {
    setLoading(true);
    try {
      const data = await markCouponUsed(code.trim());
      setResult(data.success ? { valid: true, message: data.message } : { valid: false, message: data.message });
      const updated = await findCoupon(code.trim());
      setCoupon(updated);
    } catch (err) {
      setResult({ valid: false, message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Canteen Dashboard" description="Verify student coupon codes and mark valid coupons as used." />

      <form onSubmit={searchCoupon} className="surface rounded-xl p-5">
        <label className="label" htmlFor="couponSearch">
          Coupon Code
        </label>
        <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            id="couponSearch"
            className="input uppercase"
            placeholder="DISC-4821"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            <Search size={18} />
            Search
          </button>
        </div>
      </form>

      {result && (
        <div className={`rounded-xl p-4 text-sm font-semibold ${result.valid || result.success ? 'bg-eco-50 text-eco-800 dark:bg-eco-950/30 dark:text-eco-100' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-100'}`}>
          <span className="inline-flex items-center gap-2">
            {result.valid || result.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {result.message}
          </span>
        </div>
      )}

      {coupon && (
        <section className="surface rounded-xl p-5">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 dark:border-white/10 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Coupon</p>
              <h2 className="mt-1 text-3xl font-bold">{coupon.coupon_code}</h2>
            </div>
            <Badge tone={coupon.status === 'ACTIVE' ? 'green' : coupon.status === 'USED' ? 'slate' : 'red'}>{coupon.status}</Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Info label="User Name" value={coupon.profiles?.name ?? 'Student'} />
            <Info label="Discount Value" value={formatCurrency(coupon.discount_value)} />
            <Info label="Status" value={coupon.status} />
            <Info label="Expiry" value={formatDateTime(coupon.expiry_time)} />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button className="btn-secondary" type="button" onClick={handleVerify} disabled={loading}>
              Verify Coupon
            </button>
            <button className="btn-primary" type="button" onClick={handleUse} disabled={loading || coupon.status !== 'ACTIVE'}>
              Mark As Used
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-100 p-4 dark:border-white/10">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
