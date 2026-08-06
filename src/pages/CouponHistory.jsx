import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useStudentData } from '../hooks/useStudentData';
import { formatCurrency, formatDateTime, isExpired } from '../lib/utils';
import { PageHeader, PageLoader } from './StudentDashboard';

export default function CouponHistory() {
  const { coupons = [], loading, error } = useStudentData();

  if (loading) return <PageLoader />;
  if (error) return <EmptyState title="Unable to load coupons" message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Coupon History" description="Review active, used, and expired canteen coupons." />
      <section className="surface overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Coupon Code</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expiry Time</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = coupon.status === 'EXPIRED' || (coupon.status === 'ACTIVE' && isExpired(coupon.expiry_time));
                const status = expired ? 'EXPIRED' : coupon.status;
                return (
                  <tr key={coupon.id}>
                    <td className="table-cell font-semibold">{coupon.coupon_code}</td>
                    <td className="table-cell">{formatCurrency(coupon.discount_value)}</td>
                    <td className="table-cell">
                      <Badge tone={status === 'ACTIVE' ? 'green' : status === 'USED' ? 'slate' : 'red'}>{status}</Badge>
                    </td>
                    <td className="table-cell">{formatDateTime(coupon.expiry_time)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {coupons.length === 0 && <EmptyState title="No coupons yet" message="Redeemed coupons will appear here." />}
        </div>
      </section>
    </div>
  );
}
