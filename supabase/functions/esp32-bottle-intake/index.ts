import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-secret',
};

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

  const { user_id, bottle_type, machine_id } = await req.json();
  if (!user_id || !bottle_type || !machine_id) {
    return json({ error: 'user_id, bottle_type, and machine_id are required' }, 400);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data, error } = await supabase
    .from('bottles')
    .insert({ user_id, bottle_type, machine_id })
    .select()
    .single();

  if (error) return json({ error: error.message }, 400);
  return json({ success: true, bottle: data }, 200);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
