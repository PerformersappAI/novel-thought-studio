import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXTERNAL_API = "http://187.77.199.100:8001";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // POST /register
    if (action === "register" && req.method === "POST") {
      const body = await req.json();

      // Get signed URL for reference photo if we have a face capture
      let reference_photo_url = body.reference_photo_url || "";
      if (!reference_photo_url) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("face_capture_front_url, headshot_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile?.headshot_url) {
          reference_photo_url = profile.headshot_url;
        } else if (profile?.face_capture_front_url) {
          const { data: signed } = await supabase.storage
            .from("face-captures")
            .createSignedUrl(profile.face_capture_front_url, 60 * 60);
          reference_photo_url = signed?.signedUrl || "";
        }
      }

      const payload = {
        legal_name: body.legal_name || "",
        stage_name: body.stage_name || "",
        aka_names: body.aka_names || [],
        email: body.email || user.email || "",
        reference_photo_url,
      };

      const extRes = await fetch(`${EXTERNAL_API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const extData = await extRes.json();

      // Store actor_id if returned
      if (extData?.actor_id) {
        await supabase
          .from("profiles")
          .update({ external_actor_id: extData.actor_id } as any)
          .eq("user_id", user.id);
      }

      return new Response(JSON.stringify(extData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /actor/{actor_id}
    if (action === "get_actor" && req.method === "GET") {
      const actorId = url.searchParams.get("actor_id");
      if (!actorId) {
        // Try to get from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("external_actor_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const id = (profile as any)?.external_actor_id;
        if (!id) {
          return new Response(
            JSON.stringify({ error: "No actor_id found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const extRes = await fetch(`${EXTERNAL_API}/actor/${id}`);
        const extData = await extRes.json();
        return new Response(JSON.stringify(extData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const extRes = await fetch(`${EXTERNAL_API}/actor/${actorId}`);
      const extData = await extRes.json();
      return new Response(JSON.stringify(extData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /scan
    if (action === "scan" && req.method === "POST") {
      const extRes = await fetch(`${EXTERNAL_API}/scan`, { method: "POST" });
      const extData = await extRes.json().catch(() => ({ ok: true }));
      return new Response(JSON.stringify(extData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /mentions/{actor_id}
    if (action === "get_mentions" && req.method === "GET") {
      let actorId = url.searchParams.get("actor_id");
      if (!actorId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("external_actor_id")
          .eq("user_id", user.id)
          .maybeSingle();
        actorId = (profile as any)?.external_actor_id ?? null;
      }
      if (!actorId) {
        return new Response(JSON.stringify({ mentions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const extRes = await fetch(`${EXTERNAL_API}/mentions/${actorId}`);
      const extData = await extRes.json().catch(() => ({ mentions: [] }));
      return new Response(JSON.stringify(extData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use ?action=register, ?action=get_actor, or ?action=scan" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
