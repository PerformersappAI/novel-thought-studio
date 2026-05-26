import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Require valid JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authedClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await authedClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    let actor = url.searchParams.get('actor');
    if (!actor && (req.method === 'POST')) {
      try {
        const body = await req.json();
        actor = body?.actor ?? null;
      } catch { /* ignore */ }
    }
    if (!actor || !/^[a-zA-Z0-9-]{8,64}$/.test(actor)) {
      return new Response(JSON.stringify({ error: 'invalid actor' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the requested actor belongs to the authenticated user
    const { data: profile } = await authedClient
      .from('profiles')
      .select('external_actor_id')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (!profile?.external_actor_id || profile.external_actor_id !== actor) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const endpoints = [
      `https://api.claimmyface.com/mentions/${actor}?_=${Date.now()}`,
    ];

    let lastErr: any = null;
    for (const upstream of endpoints) {
      try {
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(upstream, { method: 'GET', signal: controller.signal });
        clearTimeout(t);
        const text = await res.text();
        if (!res.ok) {
          lastErr = `HTTP ${res.status} from ${upstream}`;
          continue;
        }
        console.log(`mentions-proxy ok via ${upstream} (${text.length} bytes)`);
        return new Response(text, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e: any) {
        lastErr = e?.message || String(e);
        console.warn(`mentions-proxy failed ${upstream}: ${lastErr}`);
      }
    }
    return new Response(
      JSON.stringify({ error: 'all_upstreams_failed', message: lastErr }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'upstream_failed', message: err?.message || String(err) }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
