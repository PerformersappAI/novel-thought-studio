import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_PROFESSION = 'actor';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth required ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userData.user.id;

    const { scanId, query: queryOverride } = await req.json();

    // If a scanId was passed, verify the caller owns it before we touch it.
    if (scanId) {
      const { data: scanRow, error: scanErr } = await authClient
        .from("likeness_scans").select("user_id").eq("id", scanId).maybeSingle();
      if (scanErr || !scanRow || scanRow.user_id !== callerId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const serperKey = Deno.env.get('SERPER_API_KEY');
    if (!serperKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Serper not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve performer identity from profile
    const { data: profile } = await authClient
      .from('profiles')
      .select('legal_name, full_name, stage_name, profession')
      .eq('user_id', callerId)
      .maybeSingle();

    const performerName = (queryOverride?.trim()
      || profile?.stage_name
      || profile?.full_name
      || profile?.legal_name
      || '').trim();

    if (!performerName) {
      return new Response(
        JSON.stringify({ success: false, error: 'No performer name on profile' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profession = (profile?.profession || DEFAULT_PROFESSION).trim();
    const exactQuery = `"${performerName}" ${profession}`;
    console.log('Serper search:', exactQuery);

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: exactQuery, num: 10 }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Serper error:', data);
      if (scanId) {
        await authClient.from('likeness_scans').update({
          status: 'completed',
          query: exactQuery,
          results: [],
          result_count: 0,
          completed_at: new Date().toISOString(),
        }).eq('id', scanId);
      }
      return new Response(
        JSON.stringify({
          success: true,
          query: exactQuery,
          data: [],
          warning: data.message || `Search provider unavailable (${response.status})`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const BLOCKED_DOMAINS = [
      'microsoft.com', 'bing.com', 'google.com', 'go.microsoft.com',
      'apple.com', 'amazon.com', 'oracle.com',
    ];
    const BLOCKED_KEYWORDS = [
      'law firm', 'attorney', 'lawyer', 'legal services', 'law office', 'law group',
      'p.c.', 'llp', 'esquire',
    ];
    const nameLower = performerName.toLowerCase();

    const organic: any[] = Array.isArray(data.organic) ? data.organic : [];
    const filtered = organic.filter((r) => {
      const url: string = (r.link || '').toLowerCase();
      const title: string = (r.title || '').toLowerCase();
      const snippet: string = (r.snippet || '').toLowerCase();
      if (!url) return false;
      let host = '';
      try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { return false; }
      if (BLOCKED_DOMAINS.some((d) => host === d || host.endsWith('.' + d))) return false;
      if (/^(r|click|out|redirect|go)\./.test(host)) return false;
      if (url.includes('/redirect') || url.includes('?redirect=')) return false;
      const hay = `${title} ${snippet}`;
      if (BLOCKED_KEYWORDS.some((k) => hay.includes(k))) return false;
      // Require the actor's name in title or snippet
      return title.includes(nameLower) || snippet.includes(nameLower);
    });

    console.log(`Serper filter: ${organic.length} → ${filtered.length}`);

    const results = filtered.map((r) => ({
      url: r.link,
      title: r.title || '',
      description: r.snippet || '',
      snippet: r.snippet || '',
    }));

    if (scanId) {
      await authClient.from('likeness_scans').update({
        status: 'completed',
        query: exactQuery,
        results,
        result_count: results.length,
        completed_at: new Date().toISOString(),
      }).eq('id', scanId);
    }

    return new Response(
      JSON.stringify({ success: true, query: exactQuery, data: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scan error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Scan failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
