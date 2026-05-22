

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_BYTES = 8 * 1024 * 1024;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Public endpoint: free scans run without auth. Logged-in users may still
    // pass a Bearer token; we don't gate the response on it.


    const apiUser = Deno.env.get("SIGHTENGINE_API_USER");
    const apiSecret = Deno.env.get("SIGHTENGINE_API_SECRET");
    if (!apiUser || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "Sightengine not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { url, fileBase64, fileName, mimeType } = body ?? {};

    const models = "deepfake,genai";
    let seResponse: Response;

    if (typeof url === "string" && url.length > 0) {
      const params = new URLSearchParams({
        url,
        models,
        api_user: apiUser,
        api_secret: apiSecret,
      });
      seResponse = await fetch(
        `https://api.sightengine.com/1.0/check.json?${params.toString()}`,
      );
    } else if (typeof fileBase64 === "string" && fileBase64.length > 0) {
      if (fileBase64.length > MAX_BYTES) {
        return new Response(JSON.stringify({ error: "File too large" }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const bin = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
      const form = new FormData();
      form.append(
        "media",
        new Blob([bin], { type: mimeType || "application/octet-stream" }),
        fileName || "upload",
      );
      form.append("models", models);
      form.append("api_user", apiUser);
      form.append("api_secret", apiSecret);
      seResponse = await fetch("https://api.sightengine.com/1.0/check.json", {
        method: "POST",
        body: form,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Provide url or fileBase64" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const seData = await seResponse.json();
    if (!seResponse.ok || seData.status === "failure") {
      return new Response(
        JSON.stringify({ error: seData.error?.message || "Sightengine failed", details: seData }),
        { status: seResponse.status || 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const deepfakeScore = seData?.type?.deepfake ?? 0;
    const aiGenScore = seData?.type?.ai_generated ?? 0;
    const score = Math.max(deepfakeScore, aiGenScore);
    const manipulated = score >= 0.5;

    return new Response(
      JSON.stringify({
        success: true,
        detection: manipulated ? "Manipulated" : "Authentic",
        confidence: Math.round((manipulated ? score : 1 - score) * 100),
        deepfakeScore,
        aiGenScore,
        raw: seData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Scan failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
