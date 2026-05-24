const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, cache-control, pragma",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

const VPS_BASE = "http://187.77.199.100:8001";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Support either ?path=/mentions/xxx or trailing path after /vps-proxy/
    let path = url.searchParams.get("path") ?? "";
    if (!path) {
      const marker = "/vps-proxy";
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) path = url.pathname.slice(idx + marker.length);
    }
    if (!path.startsWith("/")) path = "/" + path;

    // Forward any other query params (excluding `path`)
    const forwardedParams = new URLSearchParams();
    for (const [k, v] of url.searchParams.entries()) {
      if (k !== "path") forwardedParams.append(k, v);
    }
    const qs = forwardedParams.toString();
    const target = `${VPS_BASE}${path}${qs ? `?${qs}` : ""}`;

    const init: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("content-type") ?? "application/json",
        Accept: "application/json",
      },
    };

    if (!["GET", "HEAD"].includes(req.method)) {
      init.body = await req.text();
    }

    console.log(`vps-proxy → ${req.method} ${target}`);
    const upstream = await fetch(target, init);
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("vps-proxy error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
