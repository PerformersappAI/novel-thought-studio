import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Batch check image URLs against Sightengine deepfake + AI-generated models.
// Body: { urls: string[] }
// Returns: { results: [{ url, deepfakeScore, aiGenScore, flagged }] }

const THRESHOLD = 0.5;
const MAX_URLS = 25;
const CONCURRENCY = 5;

async function checkUrl(url: string, apiUser: string, apiSecret: string) {
  try {
    const params = new URLSearchParams({
      url,
      models: "deepfake,genai",
      api_user: apiUser,
      api_secret: apiSecret,
    });
    const res = await fetch(`https://api.sightengine.com/1.0/check.json?${params}`);
    const data = await res.json();
    if (!res.ok || data.status === "failure") {
      return { url, error: data?.error?.message || `HTTP ${res.status}`, deepfakeScore: 0, aiGenScore: 0, flagged: false };
    }
    const deepfakeScore = data?.type?.deepfake ?? 0;
    const aiGenScore = data?.type?.ai_generated ?? 0;
    const flagged = Math.max(deepfakeScore, aiGenScore) >= THRESHOLD;
    return { url, deepfakeScore, aiGenScore, flagged };
  } catch (e) {
    return { url, error: e instanceof Error ? e.message : "fetch failed", deepfakeScore: 0, aiGenScore: 0, flagged: false };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiUser = Deno.env.get("SIGHTENGINE_API_USER");
    const apiSecret = Deno.env.get("SIGHTENGINE_API_SECRET");
    if (!apiUser || !apiSecret) {
      return new Response(JSON.stringify({ error: "Sightengine not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const urls: unknown = body?.urls;
    if (!Array.isArray(urls)) {
      return new Response(JSON.stringify({ error: "urls must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const clean = (urls as unknown[])
      .filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u))
      .slice(0, MAX_URLS);

    // Simple concurrency pool
    const results: any[] = [];
    let i = 0;
    async function worker() {
      while (i < clean.length) {
        const idx = i++;
        results[idx] = await checkUrl(clean[idx], apiUser, apiSecret);
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, clean.length) }, worker));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Scan failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
