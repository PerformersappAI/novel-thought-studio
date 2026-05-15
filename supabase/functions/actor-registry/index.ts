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
      const backgroundScan = async () => {
        try {
          const extRes = await fetch(`${EXTERNAL_API}/scan`, { method: "POST" });
          await extRes.text();
        } catch (error) {
          console.error("Background actor scan failed:", error);
        }
      };

      const task = backgroundScan();
      const edgeRuntime = (globalThis as any).EdgeRuntime;
      if (edgeRuntime?.waitUntil) edgeRuntime.waitUntil(task);
      else task.catch((error) => console.error("Actor scan task failed:", error));

      return new Response(JSON.stringify({ accepted: true, status: "scanning" }), {
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
      const mentionsList: any[] = extData?.mentions || extData?.results || extData?.data || [];

      // Build name tokens for relevance matching
      const rawNames = [
        (profile as any)?.full_name,
        (profile as any)?.stage_name,
        (profile as any)?.legal_name,
      ].filter((s): s is string => typeof s === "string" && s.trim().length > 0);
      // Build full-name phrase variants. We require ALL words of the name to
      // appear together (e.g. "will roberts"), not just one token like "roberts"
      // — otherwise domains like robertsfurniture.com slip through.
      const nameTokens = new Set<string>();
      for (const n of rawNames) {
        const lower = n.toLowerCase().trim().replace(/\s+/g, " ");
        if (lower.length < 4) continue;
        const parts = lower.split(" ").filter(Boolean);
        if (parts.length < 2) continue; // skip single-word names (too noisy)
        const joined = parts.join(" ");
        nameTokens.add(joined);                       // "will roberts"
        nameTokens.add(parts.join("-"));              // "will-roberts"
        nameTokens.add(parts.join("_"));              // "will_roberts"
        nameTokens.add(parts.join(""));               // "willroberts"
        nameTokens.add(parts.join("+"));              // url-encoded
        nameTokens.add(parts.join("%20"));            // url-encoded space
      }

      const ALLOWED_DOMAINS = new Set([
        "youtube.com","youtu.be","instagram.com","tiktok.com","facebook.com",
        "twitter.com","x.com","imdb.com","backstage.com","castingnetworks.com",
        "actorsaccess.com","spotlight.com","mandy.com","linkedin.com","vimeo.com",
        "threads.net","twitch.tv",
      ]);
      const BLOCKED_PATTERNS: RegExp[] = [
        /(^|\.)microsoft\.com$/i,
        /(^|\.)bing\.com$/i,
        /(^|\.)whatsapp\.com$/i,
        /(^|\.)wikipedia\.org$/i,
        /(^|\.)wikihow\.com$/i,
        /(^|\.)bill\.com$/i,
        /(^|\.)legilist\.com$/i,
        /(^|\.)govtrack\.us$/i,
        /\.gov$/i,
        /dictionary/i,
        /7esl\.com$/i,
        /robertscamera\.com$/i,
        /wmagazine\.com$/i,
      ];

      const filtered = (mentionsList || []).filter((m: any) => {
        const url: string = (m?.url || "").toString();
        const title: string = (m?.title || "").toString();
        if (!url) return false;
        let host = "";
        let path = "";
        try {
          const u = new URL(url);
          host = u.hostname.toLowerCase().replace(/^www\./, "");
          path = (u.pathname + " " + u.search).toLowerCase();
        } catch { return false; }

        if (BLOCKED_PATTERNS.some((re) => re.test(host))) return false;

        const haystack = (path + " " + title.toLowerCase()).replace(/%20/g, " ");
        const hasNameMatch = nameTokens.size === 0
          ? false
          : [...nameTokens].some((tok) => haystack.includes(tok));

        const rootDomain = host.split(".").slice(-2).join(".");
        const isAllowed = ALLOWED_DOMAINS.has(host) || ALLOWED_DOMAINS.has(rootDomain);

        // Require name match for everything (allowlisted or not) to prevent
        // junk like facebook.com/wmagazine or youtube.com/watch?v=W
        if (!hasNameMatch) return false;
        // Outside allowlist, only keep if there is a name match (already true here).
        return isAllowed || hasNameMatch;
      });

      console.log(`Filtered mentions ${mentionsList.length} → ${filtered.length} for tokens`, [...nameTokens]);

      return new Response(JSON.stringify({ ...extData, mentions: filtered }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use ?action=register, ?action=get_actor, ?action=scan, or ?action=get_mentions" }),
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
