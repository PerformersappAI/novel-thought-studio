import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { assetType, platform, url, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: profile }, { data: assets }] = await Promise.all([
      supabase.from("profiles").select("full_name, stage_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("registry_assets").select("registry_id, created_at").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1),
    ]);

    const performerName = profile?.stage_name || profile?.full_name || "Performer";
    const registryId = assets?.[0]?.registry_id || `CMF-${new Date().getFullYear()}-XXXXX`;
    const registeredAt = assets?.[0]?.created_at ? new Date(assets[0].created_at).toLocaleDateString() : "[Date]";

    const systemPrompt = `You are a legal documents drafter for ClaimMyFace, a likeness registry for performers.
Generate professional, legally-formatted document(s) in plain text. Pre-fill performer details where appropriate.
For "All Three", produce three clearly separated documents joined by "\n\n=== [DOCUMENT NAME] ===\n\n" headers.
Documents must include: To/From, date, registry ID reference, factual statement of unauthorized use, legal basis, demand, and signature block.`;

    const userPrompt = `Performer: ${performerName}
ClaimMyFace Registry ID: ${registryId}
First registered: ${registeredAt}

Asset type used without permission: ${assetType}
Platform where it appears: ${platform}
URL: ${url}

Requested action: ${action}

Generate the document(s) now. Use markdown-free plain text suitable for copying into email or letterhead.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const document = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ document }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("face-claim-wizard error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
