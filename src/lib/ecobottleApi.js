import { addHours } from 'date-fns';
import { supabase, isSupabaseConfigured } from './supabase';
import { bottlePointConfig } from './constants';

export function generateCouponCode() {
  return `DISC-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function getStudentSummary(userId) {
  if (!isSupabaseConfigured || !userId) return buildDemoSummary();

  const [{ data: profile, error: profileError }, { data: bottles, error: bottleError }, { data: coupons, error: couponError }, { data: pointRules, error: pointRulesError }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('bottles').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('coupons').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('bottle_point_rules').select('bottle_type, points').order('bottle_type'),
    ]);

  if (profileError || bottleError || couponError || pointRulesError) {
    throw profileError || bottleError || couponError || pointRulesError;
  }

  return { profile, bottles, coupons, pointRules };
}

export async function redeemCoupon({ userId, points }) {
  if (!isSupabaseConfigured) {
    if (demoStudentSummary.profile.total_points < points) {
      throw new Error('Insufficient points.');
    }
    const option = demoRedemptionOptions.find((item) => item.points === points);
    let couponCode = generateCouponCode();
    while (demoStudentSummary.coupons.some((item) => item.coupon_code === couponCode)) {
      couponCode = generateCouponCode();
    }
    const coupon = {
      id: Date.now(),
      coupon_code: couponCode,
      points_used: points,
      discount_value: option?.discount ?? 0,
      status: 'ACTIVE',
      expiry_time: addHours(new Date(), 24).toISOString(),
      created_at: new Date().toISOString(),
    };
    demoStudentSummary.profile.total_points -= points;
    demoStudentSummary.coupons.unshift(coupon);
    return coupon;
  }

  const { data, error } = await supabase.rpc('redeem_coupon', {
    p_user_id: userId,
    p_points_used: points,
  });
  if (error) throw error;
  return data;
}

export async function getCanteenTransactions(limit = 50) {
  if (!isSupabaseConfigured) return demoCanteenTransactions;

  const { data, error } = await supabase
    .from('transactions')
    .select('*, coupons:coupon_id(coupon_code, discount_value, created_at, profiles:user_id(name, student_id, email))')
    .order('created_at', { ascending: false })
    .limit(limit);
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
    const coupon = demoStudentSummary.coupons.find((item) => item.coupon_code === code.toUpperCase());
    if (!coupon) return { success: false, message: 'Coupon not found.' };
    if (coupon.status !== 'ACTIVE') return { success: false, message: 'Coupon is already used or expired.' };
    if (new Date(coupon.expiry_time).getTime() < Date.now()) return { success: false, message: 'Coupon has expired.' };
    coupon.status = 'USED';
    return { success: true, message: 'Coupon accepted and marked as used.' };
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
  pointRules: Object.entries(bottlePointConfig).map(([bottle_type, points]) => ({ bottle_type, points })),
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

export const demoRedemptionOptions = [
  { points: 50, discount: 10 },
  { points: 100, discount: 25 },
  { points: 200, discount: 60 },
  { points: 300, discount: 100 },
];

export const demoCanteenTransactions = [
  {
    id: 1,
    discount_amount: 25,
    created_at: addHours(new Date(), -3).toISOString(),
    coupons: {
      coupon_code: 'DISC-4821',
      discount_value: 25,
      created_at: addHours(new Date(), -6).toISOString(),
      profiles: { name: 'Riya Sharma', student_id: 'STU-2048', email: 'riya@example.edu' },
    },
  },
  {
    id: 2,
    discount_amount: 10,
    created_at: addHours(new Date(), -26).toISOString(),
    coupons: {
      coupon_code: 'DISC-1947',
      discount_value: 10,
      created_at: addHours(new Date(), -30).toISOString(),
      profiles: { name: 'Riya Sharma', student_id: 'STU-2048', email: 'riya@example.edu' },
    },
  },
];

function buildDemoSummary() {
  return {
    profile: { ...demoStudentSummary.profile },
    pointRules: [...demoStudentSummary.pointRules],
    bottles: [...demoStudentSummary.bottles],
    coupons: [...demoStudentSummary.coupons],
  };
}
