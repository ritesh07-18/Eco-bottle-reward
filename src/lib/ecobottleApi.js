import { addHours } from 'date-fns';
import { supabase, isSupabaseConfigured } from './supabase';

export function generateCouponCode() {
  return `DISC-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function getStudentSummary(userId) {
  if (!isSupabaseConfigured || !userId) return demoStudentSummary;

  const [{ data: profile, error: profileError }, { data: bottles, error: bottleError }, { data: coupons, error: couponError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('bottles').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('coupons').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

  if (profileError || bottleError || couponError) {
    throw profileError || bottleError || couponError;
  }

  return { profile, bottles, coupons };
}

export async function redeemCoupon({ userId, points, discount }) {
  if (!isSupabaseConfigured) {
    return {
      coupon_code: generateCouponCode(),
      points_used: points,
      discount_value: discount,
      status: 'ACTIVE',
      expiry_time: addHours(new Date(), 24).toISOString(),
    };
  }

  const { data, error } = await supabase.rpc('redeem_coupon', {
    p_user_id: userId,
    p_points_used: points,
    p_discount_value: discount,
  });
  if (error) throw error;
  return data;
}

export async function findCoupon(code) {
  if (!isSupabaseConfigured) {
    const coupon = demoStudentSummary.coupons.find((item) => item.coupon_code === code.toUpperCase());
    return coupon ? { ...coupon, profiles: demoStudentSummary.profile } : null;
  }

  const { data, error } = await supabase
    .from('coupons')
    .select('*, profiles:user_id(name, email, student_id)')
    .eq('coupon_code', code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function verifyCoupon(code) {
  if (!isSupabaseConfigured) {
    const coupon = await findCoupon(code);
    if (!coupon) return { valid: false, message: 'Coupon not found.' };
    if (coupon.status !== 'ACTIVE') return { valid: false, message: 'Coupon is already used or expired.' };
    if (new Date(coupon.expiry_time).getTime() < Date.now()) return { valid: false, message: 'Coupon has expired.' };
    return { valid: true, message: 'Coupon is active.', coupon };
  }

  const { data, error } = await supabase.rpc('verify_coupon', { p_coupon_code: code.toUpperCase() });
  if (error) throw error;
  return data;
}

export async function markCouponUsed(code) {
  if (!isSupabaseConfigured) {
    return { success: true, message: 'Coupon marked as used in demo mode.' };
  }

  const { data, error } = await supabase.rpc('mark_coupon_used', { p_coupon_code: code.toUpperCase() });
  if (error) throw error;
  return data;
}

export const demoStudentSummary = {
  profile: {
    id: 'demo-student',
    name: 'Riya Sharma',
    student_id: 'STU-2048',
    email: 'riya@example.edu',
    total_points: 180,
    role: 'student',
  },
  bottles: [
    { id: 1, bottle_type: 'A', points_awarded: 5, machine_id: 'COLLEGE-01', created_at: new Date().toISOString() },
    { id: 2, bottle_type: 'B', points_awarded: 10, machine_id: 'COLLEGE-02', created_at: '2026-06-25T09:30:00Z' },
    { id: 3, bottle_type: 'C', points_awarded: 15, machine_id: 'COLLEGE-01', created_at: '2026-06-22T11:45:00Z' },
    { id: 4, bottle_type: 'A', points_awarded: 5, machine_id: 'COLLEGE-03', created_at: '2026-06-18T08:10:00Z' },
  ],
  coupons: [
    {
      id: 1,
      coupon_code: 'DISC-4821',
      points_used: 100,
      discount_value: 25,
      status: 'ACTIVE',
      expiry_time: addHours(new Date(), 12).toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      coupon_code: 'DISC-1947',
      points_used: 50,
      discount_value: 10,
      status: 'USED',
      expiry_time: '2026-06-20T12:00:00Z',
      created_at: '2026-06-19T12:00:00Z',
    },
  ],
};
