import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, cache-control, pragma",
};

const EXTERNAL_API = "https://api.claimmyface.com";
const VPS_SUPABASE_URL = "https://pozwmfmqapizeoctuais.supabase.co";

async function fetchScanRunsFromRest(baseUrl: string, serviceKey: string, actorId: string | null) {
  const params = new URLSearchParams();
  params.set("select", "id,scanner_name,actor_id,started_at,finished_at,items_scanned,threats_found,legitimate_found,review_found,status,notes");
  params.set("order", "started_at.desc");
  params.set("limit", "50");
  if (actorId) params.set("or", `(actor_id.is.null,actor_id.eq.${actorId})`);
  else params.set("actor_id", "is.null");

  const res = await fetch(`${baseUrl}/rest/v1/scan_runs?${params.toString()}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!res.ok) {
    console.error("scan_runs fetch failed", baseUrl, res.status, await res.text());
    return [];
  }
  return await res.json();
}

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
    let action = url.searchParams.get("action");

    // Parse body once; also accept `action` from body since supabase.functions.invoke
    // does not forward query strings reliably.
    let body: any = {};
    if (req.method !== "GET" && req.method !== "OPTIONS") {
      try { body = await req.json(); } catch { body = {}; }
      if (!action && typeof body?.action === "string") action = body.action;
    }

    // POST /register
    if (action === "register" && req.method === "POST") {

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

    // GET /actor — always resolve to the authenticated user's own actor record.
    // The actor_id query param is ignored to prevent IDOR enumeration.
    if (action === "get_actor" && req.method === "GET") {
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

    // POST /scan
    if (action === "scan" && req.method === "POST") {
      // Resolve actor_id from profile (or request body override)
      const reqBody = await req.json().catch(() => ({} as any));
      let actorId: string | null = reqBody?.actor_id ?? null;
      if (!actorId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("external_actor_id")
          .eq("user_id", user.id)
          .maybeSingle();
        actorId = (profile as any)?.external_actor_id ?? null;
      }

      const backgroundScan = async () => {
        try {
          const extRes = await fetch(`${EXTERNAL_API}/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actorId ? { actor_id: actorId } : {}),
          });
          const text = await extRes.text();
          console.log(`VPS /scan responded ${extRes.status}: ${text.slice(0, 500)}`);
        } catch (error) {
          console.error("Background actor scan failed:", error);
        }
      };

      const task = backgroundScan();
      const edgeRuntime = (globalThis as any).EdgeRuntime;
      if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(task);
      else task.catch((error) => console.error("Actor scan task failed:", error));

      return new Response(JSON.stringify({ accepted: true, status: "scanning", actor_id: actorId }), {
        status: 202,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /mentions/{actor_id}
    if (action === "get_mentions" && req.method === "GET") {
      let actorId = url.searchParams.get("actor_id");
      const { data: profile } = await supabase
        .from("profiles")
        .select("external_actor_id, full_name, stage_name, legal_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!actorId) actorId = (profile as any)?.external_actor_id ?? null;
      if (!actorId) {
        return new Response(JSON.stringify({ mentions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const extRes = await fetch(`${EXTERNAL_API}/mentions/${actorId}`);
      const rawText = await extRes.text();
      let extData: any;
      try { extData = JSON.parse(rawText); } catch { extData = { mentions: [] }; }
      console.log(`Passing through ${(extData?.mentions || extData?.results || extData?.data || []).length} mentions from VPS`);
      return new Response(JSON.stringify(extData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET scan runs for the current performer, including unassigned rows written by service jobs
    if (action === "get_scan_runs" && req.method === "GET") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("external_actor_id")
        .eq("user_id", user.id)
        .maybeSingle();
      const profileActorId = (profile as any)?.external_actor_id ?? null;
      const requestedActorId = url.searchParams.get("actor_id");
      const actorId = requestedActorId && requestedActorId === profileActorId ? requestedActorId : profileActorId;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const vpsServiceKey = Deno.env.get("VPS_SUPABASE_SERVICE_ROLE_KEY") || serviceKey;
      console.log(`get_scan_runs user=${user.id} actor_id=${actorId ?? "none"}`);

      const [localRuns, vpsRuns] = await Promise.all([
        fetchScanRunsFromRest(Deno.env.get("SUPABASE_URL")!, serviceKey, actorId),
        fetchScanRunsFromRest(VPS_SUPABASE_URL, vpsServiceKey, actorId),
      ]);

      const runs = [...localRuns, ...vpsRuns].sort(
        (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
      );

      console.log(`get_scan_runs local=${localRuns.length} vps=${vpsRuns.length} total=${runs.length}`);

      return new Response(JSON.stringify({ actor_id: actorId, scan_runs: runs }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use ?action=register, ?action=get_actor, ?action=scan, ?action=get_mentions, or ?action=get_scan_runs" }),
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
