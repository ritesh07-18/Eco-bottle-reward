import { useCallback, useEffect, useMemo, useState } from 'react';
import { getStudentSummary } from '../lib/ecobottleApi';
import { useAuth } from '../context/AuthContext';

export function useStudentData() {
  const { user, profile: authProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const summary = await getStudentSummary(user?.id);
      setData({
        ...summary,
        profile: authProfile ? { ...summary.profile, ...authProfile } : summary.profile,
      });
    } catch (err) {
      setError(err.message ?? 'Unable to load student data.');
    } finally {
      setLoading(false);
    }
  }, [authProfile, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const monthly = useMemo(() => buildMonthlyData(data?.bottles ?? []), [data?.bottles]);

  return {
    ...data,
    monthly,
    loading,
    error,
    reload: load,
  };
}

function buildMonthlyData(bottles) {
  const formatter = new Intl.DateTimeFormat('en-IN', { month: 'short' });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return {
      key,
      month: formatter.format(date),
      bottles: 0,
      points: 0,
    };
  });

  const monthMap = new Map(months.map((item) => [item.key, item]));

  bottles.forEach((bottle) => {
    const date = new Date(bottle.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const bucket = monthMap.get(key);
    if (!bucket) return;
    bucket.bottles += 1;
    bucket.points += bottle.points_awarded ?? 0;
  });

  return months;
}
