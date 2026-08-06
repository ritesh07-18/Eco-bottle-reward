import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-secret',
};

const url = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const expectedSecret = Deno.env.get('ESP32_DEVICE_SECRET');
  const providedSecret = req.headers.get('x-device-secret');
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return json({ error: 'Unauthorized device' }, 401);
  }

  const body = await req.json().catch(() => null);

  const action = body?.action?.trim();
  if (action === 'login') return handleLogin(body);
  if (action === 'intake') return handleIntake(body);
  return json({ error: "action must be 'login' or 'intake'" }, 400);
});

async function handleLogin(body: Record<string, unknown>) {
  const phone = String(body?.phone ?? '').replace(/\D/g, '').slice(-10);
  const password = String(body?.password ?? '');

  if (phone.length !== 10 || !password) {
    return json({ error: 'phone (10 digits) and password are required' }, 400);
  }

  const email = `${phone}@eco.in`;
  const anon = createClient(url, anonKey);
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) {
    return json({ error: 'Invalid phone number or password' }, 401);
  }

  const user = data.user;
  const service = createClient(url, serviceKey);
  const { data: profile } = await service
    .from('profiles')
    .select('id, name, total_points')
    .eq('id', user.id)
    .maybeSingle();

  return json({
    success: true,
    user_id: user.id,
    name: profile?.name ?? '',
    total_points: profile?.total_points ?? 0,
    access_token: data.session?.access_token ?? null,
    expires_at: data.session?.expires_at ?? 0,
  });
}

async function handleIntake(body: Record<string, unknown>) {
  const user_id = String(body?.user_id ?? '').trim();
  const access_token = String(body?.access_token ?? '').trim();
  const bottle_type = String(body?.bottle_type ?? '').trim().toUpperCase();
  const machine_id = String(body?.machine_id ?? '').trim();

  if (!user_id || !access_token || !bottle_type || !machine_id) {
    return json({ error: 'user_id, access_token, bottle_type, and machine_id are required' }, 400);
  }

  if (!['A', 'B', 'C'].includes(bottle_type)) {
    return json({ error: `Unsupported bottle_type: ${bottle_type}` }, 400);
  }

  const anon = createClient(url, anonKey);
  const { data: tokenData, error: tokenError } = await anon.auth.getUser(access_token);
  if (tokenError || !tokenData.user || tokenData.user.id !== user_id) {
    return json({ error: 'Invalid or expired session. Log in again.' }, 401);
  }

  const service = createClient(url, serviceKey);
  const { data, error } = await service
    .from('bottles')
    .insert({ user_id, bottle_type, machine_id })
    .select()
    .single();

  if (error) return json({ error: error.message }, 400);

  return json({ success: true, bottle: data, points: data.points_awarded }, 200);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
