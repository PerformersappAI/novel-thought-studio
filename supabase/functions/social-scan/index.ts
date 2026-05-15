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
  legal_name: string;
  stage_name?: string;
}

interface ProfileResult {
  platform: string;
  url: string;
  username?: string;
  display_name?: string;
  bio_snippet?: string;
  profile_pic_url?: string;
  follower_count?: number;
  search_query: string;
  match_reason: string;
}

function buildQueries(legalName: string, stageName?: string): Array<{ q: string; reason: string }> {
  const out: Array<{ q: string; reason: string }> = [];
  const seen = new Set<string>();
  const push = (q: string, reason: string) => {
    const k = q.trim().toLowerCase();
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push({ q: q.trim(), reason });
  };

  if (legalName) {
    push(legalName, "Exact name match");
    push(`${legalName} official`, "Name + official keyword");
    push(`${legalName} actor`, "Name + actor keyword");
    push(`${legalName} booking`, "Name + booking keyword");
    push(`${legalName} fan`, "Possible fan/impersonation account");
  }
  if (stageName && stageName.toLowerCase() !== legalName.toLowerCase()) {
    push(stageName, "Stage name match");
    push(`${stageName} official`, "Stage name + official keyword");
    push(`${stageName} actor`, "Stage name + actor keyword");
  }
  return out;
}

async function hashUrl(url: string): Promise<string> {
  const encoded = new TextEncoder().encode(url.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function scoreResult(displayName: string, bio: string, legalName: string, stageName?: string) {
  const lower = (displayName + " " + bio).toLowerCase();
  const legalLower = legalName.toLowerCase();
  const stageLower = (stageName || "").toLowerCase();
  let confidence = 30;
  if (lower.includes(legalLower)) confidence += 30;
  if (stageLower && lower.includes(stageLower)) confidence += 25;
  if (lower.includes("official")) confidence += 10;
  if (lower.includes("booking")) confidence += 10;
  if (lower.includes("fan")) confidence -= 10;
  if (lower.includes("parody")) confidence -= 20;
  confidence = Math.max(10, Math.min(95, confidence));
  let risk = "low";
  if (confidence >= 70) risk = "high";
  else if (confidence >= 50) risk = "medium";
  return { confidence, risk };
}

async function runApifyActor(actorId: string, input: any, timeoutMs = 90000): Promise<any[]> {
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=${Math.floor(timeoutMs / 1000)}`;
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

async function searchInstagram(query: string, reason: string): Promise<ProfileResult[]> {
  // apify/instagram-search-scraper
  const items = await runApifyActor("apify~instagram-search-scraper", {
    search: query,
    searchType: "user",
    searchLimit: 10,
    resultsLimit: 10,
  });
  return items.slice(0, 10).map((item: any) => ({
    platform: "Instagram",
    url: item.url || (item.username ? `https://www.instagram.com/${item.username}/` : ""),
    username: item.username || "",
    display_name: item.fullName || item.full_name || item.name || item.username || "",
    bio_snippet: (item.biography || item.bio || "").slice(0, 300),
    profile_pic_url: item.profilePicUrl || item.profile_pic_url || item.profilePicUrlHD || "",
    follower_count: typeof item.followersCount === "number" ? item.followersCount : (typeof item.followers === "number" ? item.followers : undefined),
    search_query: query,
    match_reason: reason,
  })).filter((r) => r.url);
}

async function searchTikTok(query: string, reason: string): Promise<ProfileResult[]> {
  // clockworks/free-tiktok-scraper - search via searchQueries
  const items = await runApifyActor("clockworks~free-tiktok-scraper", {
    searchQueries: [query],
    resultsPerPage: 10,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false,
    shouldDownloadSubtitles: false,
    proxyCountryCode: "None",
  });
  // The free scraper returns videos; extract author info
  const seen = new Set<string>();
  const out: ProfileResult[] = [];
  for (const item of items) {
    const author = item.authorMeta || item.author || {};
    const handle = author.name || author.uniqueId || item.authorUniqueId || "";
    if (!handle || seen.has(handle)) continue;
    seen.add(handle);
    out.push({
      platform: "TikTok",
      url: author.profileUrl || `https://www.tiktok.com/@${handle}`,
      username: handle,
      display_name: author.nickName || author.nickname || handle,
      bio_snippet: (author.signature || "").slice(0, 300),
      profile_pic_url: author.avatar || author.avatarLarger || author.avatarMedium || "",
      follower_count: typeof author.fans === "number" ? author.fans : (typeof author.followerCount === "number" ? author.followerCount : undefined),
      search_query: query,
      match_reason: reason,
    });
    if (out.length >= 10) break;
  }
  return out;
}

async function searchLinkedIn(query: string, reason: string): Promise<ProfileResult[]> {
  // curious_coder/linkedin-profile-search-scraper
  const items = await runApifyActor("curious_coder~linkedin-profile-search-scraper", {
    queries: [query],
    searchQueries: [query],
    maxResults: 10,
    maxItems: 10,
  });
  return items.slice(0, 10).map((item: any) => ({
    platform: "LinkedIn",
    url: item.profileUrl || item.url || item.linkedinUrl || "",
    username: item.publicIdentifier || "",
    display_name: item.fullName || item.name || `${item.firstName || ""} ${item.lastName || ""}`.trim(),
    bio_snippet: (item.headline || item.title || item.summary || "").slice(0, 300),
    profile_pic_url: item.profilePicture || item.pictureUrl || item.profileImage || "",
    follower_count: typeof item.followerCount === "number" ? item.followerCount : undefined,
    search_query: query,
    match_reason: reason,
  })).filter((r) => r.url);
}

async function searchYouTube(query: string, reason: string): Promise<ProfileResult[]> {
  // streamers/youtube-scraper accepts searchKeywords and returns videos with channel info
  const items = await runApifyActor("streamers~youtube-scraper", {
    searchKeywords: query,
    maxResults: 10,
    maxResultsShorts: 0,
    maxResultStreams: 0,
  });
  const seen = new Set<string>();
  const out: ProfileResult[] = [];
  for (const item of items) {
    const handle = item.channelUsername || item.channelName || item.channelId || "";
    const channelUrl = item.channelUrl || (handle ? `https://www.youtube.com/${handle.startsWith("@") ? handle : "@" + handle}` : "");
    if (!channelUrl || seen.has(channelUrl)) continue;
    seen.add(channelUrl);
    out.push({
      platform: "YouTube",
      url: channelUrl,
      username: handle,
      display_name: item.channelName || handle,
      bio_snippet: (item.channelDescription || item.text || "").slice(0, 300),
      profile_pic_url: item.channelAvatarUrl || item.channelThumbnail || "",
      follower_count: typeof item.numberOfSubscribers === "number" ? item.numberOfSubscribers : undefined,
      search_query: query,
      match_reason: reason,
    });
    if (out.length >= 10) break;
  }
  return out;
}

async function searchFacebook(query: string, reason: string): Promise<ProfileResult[]> {
  // apify/facebook-pages-search-scraper - searches public Facebook pages by keyword
  const items = await runApifyActor("apify~facebook-pages-search-scraper", {
    searchQueries: [query],
    queries: [query],
    maxItems: 10,
    maxResults: 10,
  });
  return items.slice(0, 10).map((item: any) => ({
    platform: "Facebook",
    url: item.url || item.pageUrl || item.facebookUrl || "",
    username: item.username || item.pageName || "",
    display_name: item.title || item.name || item.pageName || "",
    bio_snippet: (item.intro || item.about || item.description || "").slice(0, 300),
    profile_pic_url: item.profilePictureUrl || item.profilePhoto || item.image || "",
    follower_count: typeof item.followers === "number" ? item.followers : (typeof item.likes === "number" ? item.likes : undefined),
    search_query: query,
    match_reason: reason,
  })).filter((r) => r.url);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!APIFY_TOKEN) {
      return new Response(JSON.stringify({ error: "APIFY_TOKEN is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, legal_name, stage_name } = (await req.json()) as ScanRequest;
    if (!user_id || !legal_name) {
      return new Response(JSON.stringify({ error: "user_id and legal_name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queries = buildQueries(legal_name, stage_name);
    console.log("Running social-scan queries:", queries.map((q) => q.q));

    const allResults: ProfileResult[] = [];
    for (const { q, reason } of queries) {
      const [ig, tt, yt, fb] = await Promise.all([
        searchInstagram(q, reason),
        searchTikTok(q, reason),
        searchYouTube(q, reason),
        searchFacebook(q, reason),
      ]);
      console.log(`Query "${q}" → IG:${ig.length} TT:${tt.length} YT:${yt.length} FB:${fb.length}`);
      allResults.push(...ig, ...tt, ...yt, ...fb);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const seen = new Set<string>();
    let savedCount = 0;
    const byPlatform: Record<string, number> = {};

    for (const result of allResults) {
      if (!result.url) continue;
      const urlHash = await hashUrl(result.url);
      if (seen.has(urlHash)) continue;
      seen.add(urlHash);

      const { confidence, risk } = scoreResult(
        result.display_name || "",
        result.bio_snippet || "",
        legal_name,
        stage_name,
      );

      const { error } = await supabaseAdmin
        .from("possible_fake_profiles")
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
            found_at: new Date().toISOString(),
          },
          { onConflict: "user_id,url_hash" },
        );

      if (error) console.error("Insert error:", error);
      else {
        savedCount++;
        byPlatform[result.platform] = (byPlatform[result.platform] || 0) + 1;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_found: allResults.length,
        saved: savedCount,
        by_platform: byPlatform,
        queries_run: queries.length,
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
