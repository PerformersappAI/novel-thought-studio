import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BASE64_CHARS = 12 * 1024 * 1024;

type GatewayContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

const cleanJson = (text: string) => {
  const stripped = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : stripped);
};

const normalize = (raw: any) => {
  const verdict = raw?.verdict === "likely_fake" ? "likely_fake" : "likely_real";
  const fakeConfidence = Number(raw?.fake_confidence_pct ?? (verdict === "likely_fake" ? 65 : 20));
  const fakeScore = Math.max(0, Math.min(100, Math.round(fakeConfidence))) / 100;
  return {
    success: true,
    detection: verdict === "likely_fake" ? "Manipulated" : "Authentic",
    confidence: verdict === "likely_fake" ? Math.round(fakeScore * 100) : Math.round((1 - fakeScore) * 100),
    verdict,
    fake_confidence_pct: Math.round(fakeScore * 100),
    note: String(raw?.note || "AI visual review completed. Treat this as an estimate, not proof."),
    deepfakeScore: fakeScore,
    aiGenScore: fakeScore,
    raw,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { url, fileBase64, fileName, mimeType } = body ?? {};
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI scanner is not configured");

    let content: GatewayContent;
    if (typeof fileBase64 === "string" && fileBase64.length > 0) {
      if (fileBase64.length > MAX_BASE64_CHARS) {
        return new Response(JSON.stringify({ error: "File too large. Try an image under 8MB." }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      content = [
        {
          type: "text",
          text: `Analyze this uploaded image (${fileName || "upload"}) for visible signs of AI generation, deepfake manipulation, compositing, artifacts, metadata stripping implications, and authenticity.`,
        },
        { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${fileBase64}` } },
      ];
    } else if (typeof url === "string" && url.trim().length > 0) {
      content = [
        {
          type: "text",
          text: `Analyze this image or public social/media URL for suspicious manipulation signals and source context: ${url.trim()}`,
        },
        { type: "image_url", image_url: { url: url.trim() } },
      ];
    } else {
      return new Response(JSON.stringify({ error: "Provide an image URL or upload an image." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              'You are ClaimMyFace\'s image analysis assistant. Return ONLY valid JSON with: verdict ("likely_fake" or "likely_real"), fake_confidence_pct (0-100), note (short plain-English explanation). Be cautious: if there are no strong visible manipulation signs, return likely_real. Never claim legal proof.',
          },
          { role: "user", content },
        ],
      }),
    });

    if (!aiResp.ok) {
      const detail = await aiResp.text().catch(() => "");
      console.error("AI scanner error", aiResp.status, detail);
      return new Response(JSON.stringify({ error: "Image analysis failed" }), {
        status: aiResp.status === 429 ? 429 : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = cleanJson(text);

    return new Response(JSON.stringify(normalize(parsed)), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("image scanner error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Scan failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});