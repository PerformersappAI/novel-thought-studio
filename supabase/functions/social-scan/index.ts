import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;


interface ScanRequest {
  user_id: string;
  legal_name?: string;
  stage_name?: string;
}

interface ProfileResult {
  platform: string;
  actor_id: string;
  url: string;
  username?: string;
  display_name?: string;
  bio_snippet?: string;
  profile_pic_url?: string;
  follower_count?: number;
  search_query: string;
  match_reason: string;
  raw_result: Record<string, unknown>;
}

async function hashUrl(url: string): Promise<string> {
  const encoded = new TextEncoder().encode(url.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function scoreResult(displayName: string, bio: string) {
  const lower = `${displayName} ${bio}`.toLowerCase();
  let confidence = 45;
  if (lower.includes(EXACT_NAME_QUERY.toLowerCase())) confidence += 35;
  if (lower.includes("official") || lower.includes("actor") || lower.includes("performer")) confidence += 10;
  if (lower.includes("fan") || lower.includes("parody") || lower.includes("backup")) confidence -= 10;
  confidence = Math.max(10, Math.min(95, confidence));
  const risk = confidence >= 70 ? "high" : confidence >= 50 ? "medium" : "low";
  return { confidence, risk };
}

async function runApifyActor(actorId: string, input: Record<string, unknown>, timeoutMs = 90000): Promise<any[]> {
  if (!APIFY_TOKEN) return [];
  const apiActorId = actorId.replace("/", "~");
  const url = `https://api.apify.com/v2/acts/${apiActorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${Math.floor(timeoutMs / 1000)}`;

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      console.error(`Apify ${actorId} failed:`, resp.status, (await resp.text()).slice(0, 500));
      return [];
    }

    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`Apify ${actorId} error:`, e);
    return [];
  }
}

async function searchInstagram(query: string): Promise<ProfileResult[]> {
  const actorId = "apify/instagram-scraper";
  const items = await runApifyActor(actorId, {
    search: query,
    searchType: "user",
    resultsType: "profiles",
    resultsLimit: 25,
  });

  return items
    .slice(0, 25)
    .map((item: any) => ({
      platform: "Instagram",
      actor_id: actorId,
      url: item.url || item.profileUrl || (item.username ? `https://www.instagram.com/${item.username}/` : ""),
      username: item.username || item.ownerUsername || "",
      display_name: item.fullName || item.full_name || item.name || item.username || "",
      bio_snippet: (item.biography || item.bio || item.description || "").slice(0, 300),
      profile_pic_url: item.profilePicUrl || item.profilePicUrlHD || item.profile_pic_url || "",
      follower_count: typeof item.followersCount === "number" ? item.followersCount : typeof item.followers === "number" ? item.followers : undefined,
      search_query: query,
      match_reason: "Exact name search across Instagram profiles",
      raw_result: item,
    }))
    .filter((r) => r.url);
}

async function searchTikTok(query: string): Promise<ProfileResult[]> {
  const actorId = "clockworks/tiktok-scraper";
  const items = await runApifyActor(actorId, {
    searchQueries: [query],
    resultsPerPage: 25,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
  });

  const seen = new Set<string>();
  const results: ProfileResult[] = [];

  for (const item of items) {
    const author = item.authorMeta || item.author || item.user || {};
    const handle = author.name || author.uniqueId || author.id || item.authorUniqueId || item.username || "";
    const url = author.profileUrl || item.authorUrl || item.profileUrl || (handle ? `https://www.tiktok.com/@${handle}` : item.webVideoUrl || item.url || "");
    if (!url || seen.has(url)) continue;
    seen.add(url);

    results.push({
      platform: "TikTok",
      actor_id: actorId,
      url,
      username: handle,
      display_name: author.nickName || author.nickname || item.authorName || handle,
      bio_snippet: (author.signature || item.text || item.description || "").slice(0, 300),
      profile_pic_url: author.avatar || author.avatarLarger || author.avatarMedium || item.avatarUrl || "",
      follower_count: typeof author.fans === "number" ? author.fans : typeof author.followerCount === "number" ? author.followerCount : undefined,
      search_query: query,
      match_reason: "Exact name search across TikTok accounts and posts",
      raw_result: item,
    });

    if (results.length >= 25) break;
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // --- Auth: require a valid JWT, derive user_id server-side ---
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authedClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authedClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user_id = userData.user.id;

    if (!APIFY_TOKEN) {
      return new Response(JSON.stringify({ error: "APIFY_TOKEN is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const query = EXACT_NAME_QUERY;
    console.log("Running social-scan exact query:", query);

    const [instagram, tiktok] = await Promise.all([
      searchInstagram(query),
      searchTikTok(query),
    ]);
    const allResults = [...instagram, ...tiktok];
    console.log(`Exact query "${query}" → Instagram:${instagram.length} TikTok:${tiktok.length}`);

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const VPS_SUPABASE_URL = "https://pozwmfmqapizeoctuais.supabase.co";
    const VPS_SERVICE_KEY = Deno.env.get("VPS_SUPABASE_SERVICE_ROLE_KEY");
    const VPS_ACTOR_ID = "8e53f67f-5290-42ff-bab1-b14dd4d08605";
    const vpsSupabase = VPS_SERVICE_KEY ? createClient(VPS_SUPABASE_URL, VPS_SERVICE_KEY) : null;

    const seen = new Set<string>();
    let savedCount = 0;
    let vpsSaved = 0;
    const byPlatform: Record<string, number> = {};

    for (const result of allResults) {
      if (!result.url) continue;
      const urlHash = await hashUrl(result.url);
      if (seen.has(urlHash)) continue;
      seen.add(urlHash);

      const { confidence, risk } = scoreResult(result.display_name || "", result.bio_snippet || "");

      const { error } = await supabaseAdmin
        .from("social_scans")
        .upsert(
          {
            user_id,
            platform: result.platform,
            url: result.url,
            url_hash: urlHash,
            username: result.username || null,
            display_name: result.display_name || null,
            bio_snippet: result.bio_snippet || null,
            profile_pic_url: result.profile_pic_url || null,
            follower_count: result.follower_count ?? null,
            match_reason: result.match_reason,
            confidence_score: confidence,
            risk_level: risk,
            status: "needs_review",
            search_query: result.search_query,
            actor_id: result.actor_id,
            raw_result: result.raw_result,
            found_at: new Date().toISOString(),
          },
          { onConflict: "user_id,url_hash" },
        );

      if (error) console.error("social_scans upsert error:", error);
      else {
        savedCount++;
        byPlatform[result.platform] = (byPlatform[result.platform] || 0) + 1;
      }

      if (vpsSupabase) {
        const mentionType = result.platform === "Instagram" ? "social_instagram" : "social_tiktok";
        const { error: vpsErr } = await vpsSupabase.from("mentions").insert({
          user_id,
          actor_id: VPS_ACTOR_ID,
          mention_type: mentionType,
          title: result.display_name || result.username || result.url,
          url: result.url,
          status: "New Alert",
          confidence: confidence,
          category: "Social Media",
          media_type: "profile",
          thumbnail_url: result.profile_pic_url || null,
          excerpt: result.bio_snippet || null,
          match_label: result.match_reason || null,
          found_at: new Date().toISOString(),
        });
        if (vpsErr) console.error("VPS mentions insert error:", vpsErr);
        else vpsSaved++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_found: allResults.length,
        saved: savedCount,
        vps_saved: vpsSaved,
        by_platform: byPlatform,
        query,
        actors_run: ["apify/instagram-scraper", "clockworks/tiktok-scraper"],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Social scan error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
