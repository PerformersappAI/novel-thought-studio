import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    const upstream = `https://api.claimmyface.com/mentions/${actor}?_=${Date.now()}`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(upstream, { method: 'GET', signal: controller.signal });
    clearTimeout(t);

    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'upstream_failed', message: err?.message || String(err) }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
