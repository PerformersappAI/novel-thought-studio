import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

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
  search_query: string;
}

// Generate search queries from performer data
function buildQueries(legalName: string, stageName?: string): string[] {
  const names = [legalName];
  if (stageName && stageName !== legalName) names.push(stageName);

  const queries: string[] = [];
  for (const name of names) {
    if (!name.trim()) continue;
    queries.push(name);
    queries.push(`${name} official`);
    queries.push(`${name} actor`);
    queries.push(`${name} booking`);
    queries.push(`${name} fan`);
  }
  return queries;
}

// Simple hash for deduplication
async function hashUrl(url: string): Promise<string> {
  const encoded = new TextEncoder().encode(url.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Determine confidence and risk based on name matching
function scoreResult(
  displayName: string,
  bio: string,
  legalName: string,
  stageName?: string
): { confidence: number; risk: string } {
  const lower = (displayName + " " + bio).toLowerCase();
  const legalLower = legalName.toLowerCase();
  const stageLower = (stageName || "").toLowerCase();

  let confidence = 30; // baseline

  // Exact name match is high signal
  if (lower.includes(legalLower)) confidence += 30;
  if (stageLower && lower.includes(stageLower)) confidence += 25;

  // Keywords that suggest impersonation
  if (lower.includes("official")) confidence += 10;
  if (lower.includes("booking")) confidence += 10;
  if (lower.includes("fan")) confidence -= 10; // Fan accounts are lower risk
  if (lower.includes("parody")) confidence -= 20;

  confidence = Math.max(10, Math.min(95, confidence));

  let risk = "low";
  if (confidence >= 70) risk = "high";
  else if (confidence >= 50) risk = "medium";

  return { confidence, risk };
}

// Search Instagram via Apify
async function searchInstagram(query: string): Promise<ProfileResult[]> {
  if (!APIFY_TOKEN) return [];
  try {
    const resp = await fetch(
      `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search: query,
          searchType: "user",
          resultsLimit: 5,
        }),
      }
    );
    if (!resp.ok) {
      console.error("Instagram search failed:", resp.status, await resp.text());
      return [];
    }
    const data = await resp.json();
    return (data || []).slice(0, 5).map((item: any) => ({
      platform: "Instagram",
      url: item.url || `https://www.instagram.com/${item.username || ""}`,
      username: item.username || "",
      display_name: item.fullName || item.name || "",
      bio_snippet: (item.biography || item.bio || "").slice(0, 300),
      search_query: query,
    }));
  } catch (e) {
    console.error("Instagram search error:", e);
    return [];
  }
}

// Search TikTok via Apify
async function searchTikTok(query: string): Promise<ProfileResult[]> {
  if (!APIFY_TOKEN) return [];
  try {
    const resp = await fetch(
      `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchQueries: [query],
          resultsPerPage: 5,
          searchSection: "users",
        }),
      }
    );
    if (!resp.ok) {
      console.error("TikTok search failed:", resp.status, await resp.text());
      return [];
    }
    const data = await resp.json();
    return (data || []).slice(0, 5).map((item: any) => ({
      platform: "TikTok",
      url: item.profileUrl || item.webVideoUrl || `https://www.tiktok.com/@${item.uniqueId || ""}`,
      username: item.uniqueId || item.nickname || "",
      display_name: item.nickname || item.uniqueId || "",
      bio_snippet: (item.signature || item.bio || "").slice(0, 300),
      search_query: query,
    }));
  } catch (e) {
    console.error("TikTok search error:", e);
    return [];
  }
}

// Search LinkedIn via Apify
async function searchLinkedIn(query: string): Promise<ProfileResult[]> {
  if (!APIFY_TOKEN) return [];
  try {
    const resp = await fetch(
      `https://api.apify.com/v2/acts/anchor~linkedin-people-search/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerms: [query],
          maxResults: 5,
        }),
      }
    );
    if (!resp.ok) {
      console.error("LinkedIn search failed:", resp.status, await resp.text());
      return [];
    }
    const data = await resp.json();
    return (data || []).slice(0, 5).map((item: any) => ({
      platform: "LinkedIn",
      url: item.profileUrl || item.url || "",
      username: "",
      display_name: item.fullName || item.name || "",
      bio_snippet: (item.headline || item.title || "").slice(0, 300),
      search_query: query,
    }));
  } catch (e) {
    console.error("LinkedIn search error:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!APIFY_TOKEN) {
      return new Response(
        JSON.stringify({ error: "APIFY_TOKEN is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id, legal_name, stage_name } = (await req.json()) as ScanRequest;

    if (!user_id || !legal_name) {
      return new Response(
        JSON.stringify({ error: "user_id and legal_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const queries = buildQueries(legal_name, stage_name);
    const allResults: ProfileResult[] = [];

    // Run searches across platforms — use only the base name queries (first 2) per platform to stay in budget
    const coreQueries = queries.slice(0, 4);

    for (const q of coreQueries) {
      const [ig, tt, li] = await Promise.all([
        searchInstagram(q),
        searchTikTok(q),
        searchLinkedIn(q),
      ]);
      allResults.push(...ig, ...tt, ...li);
    }

    // Deduplicate by URL hash and save
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const seen = new Set<string>();
    let savedCount = 0;

    for (const result of allResults) {
      if (!result.url) continue;
      const urlHash = await hashUrl(result.url);
      if (seen.has(urlHash)) continue;
      seen.add(urlHash);

      const { confidence, risk } = scoreResult(
        result.display_name || "",
        result.bio_snippet || "",
        legal_name,
        stage_name
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
            confidence_score: confidence,
            risk_level: risk,
            status: "needs_review",
            search_query: result.search_query,
            found_at: new Date().toISOString(),
          },
          { onConflict: "user_id,url_hash" }
        );

      if (error) {
        console.error("Insert error:", error);
      } else {
        savedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_found: allResults.length,
        saved: savedCount,
        queries_run: coreQueries.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Social scan error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
