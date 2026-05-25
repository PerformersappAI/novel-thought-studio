import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  ExternalLink,
  ImageIcon,
  Youtube,
  Instagram,
  Music2,
  Globe,
  Newspaper,
  ShieldCheck,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Eye,
  FileText,
  Gavel,
  Flag,
  Video,
  ScanFace,
  Mic,
  PenLine,
  UserX,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_ACTOR_ID = "8e53f67f-5290-42ff-bab1-b14dd4d08605";

interface Mention {
  id: string;
  mention_type: string;
  title: string | null;
  url: string | null;
  found_at: string;
  status?: string | null;
  actor_name?: string | null;
  relevance?: RelevanceTag;
  relevance_reason?: string;
}

type RelevanceTag =
  | "verified"           // matches a saved handle / owned domain
  | "likely"             // exact name + actor/persona context
  | "needs_review"       // image match or weak signal
  | "ai_alert";          // deepfake / AI-image flagged

const PHOTO_TYPES = new Set(["image_yandex", "image"]);
const VIDEO_TYPES = new Set(["youtube"]);
const SOCIAL_TYPES = new Set(["social_instagram", "social_tiktok"]);
const WEB_TYPES = new Set(["web", "news"]);
const DEEPFAKE_TYPES = new Set(["deepfake"]);
const VOICE_TYPES = new Set(["voice"]);
const WRITING_TYPES = new Set(["writing"]);
const IMPERSONATION_TYPES = new Set(["possible_impersonation"]);
const SOCIAL_KNOWN_TYPES = new Set(["social_known"]);


// Actor/persona context keywords — at least one must appear alongside the name
// for a same-name result to be considered a real match.
const PERSONA_KEYWORDS = [
  "actor", "actress", "actor's", "acting", "performer", "performance",
  "voice over", "voiceover", "voice-over", "vo ", "demo reel", "headshot",
  "imdb", "oppenheimer", "filmmaker", "film", "tv", "show", "movie", "cast",
  "casting", "director", "producer", "screen", "stage", "comedian", "comedy",
  "keynote", "speaker", "sag", "aftra", "union",
];


function extractDomain(url?: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Domains that serve junk asset/CDN/icon results, not real mentions.
const JUNK_DOMAINS = new Set([
  "yastatic.net",
  "gstatic.com",
  "ssl.gstatic.com",
  "encrypted-tbn0.gstatic.com",
  "favicon.ico",
  "googleusercontent.com",
  "ytimg.com",
  "fbsbx.com",
  "fbcdn.net",
]);

const JUNK_PATH_PATTERNS = [
  /\.svg($|\?)/i,
  /\.ico($|\?)/i,
  /\/favicon/i,
  /sprite/i,
  /placeholder/i,
];

function isJunkMention(m: { url: string | null; title: string | null }): boolean {
  if (!m.url) return true;
  const host = extractDomain(m.url);
  if (!host) return true;
  if (JUNK_DOMAINS.has(host)) return true;
  // Drop URLs that are clearly static asset paths (svg/ico/favicons/sprites).
  if (JUNK_PATH_PATTERNS.some((re) => re.test(m.url!))) return true;
  // Drop entries with no title AND no real-looking path (just a hostname or root).
  try {
    const u = new URL(m.url);
    const hasContent = u.pathname.length > 1 || u.search.length > 0;
    if (!m.title && !hasContent) return true;
  } catch {
    return true;
  }
  return false;
}

function iconFor(type: string) {
  const t = type.toLowerCase();
  if (t === "youtube") return Youtube;
  if (t === "social_instagram") return Instagram;
  if (t === "social_tiktok") return Music2;
  if (t === "image_yandex") return ImageIcon;
  if (t === "news") return Newspaper;
  return Globe;
}

type Verdict = "informational" | "legitimate" | "threat";

const STORAGE_KEY = "monitoring.verdicts.v1";

function loadVerdicts(): Record<string, Verdict> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveVerdicts(v: Record<string, Verdict>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

// ---------- Identity context + relevance gate ----------

interface Identity {
  fullName: string;          // lowercased, e.g. "will roberts"
  nameTokens: string[];      // ["will","roberts"]
  lastName: string;          // "roberts"
  akaNames: string[];        // lowercased
  instagram: string;         // handle, no @, lowercased
  tiktok: string;
  youtube: string;
  trustedDomains: Set<string>;   // imdb.com, owned youtube, etc.
  profession: string;        // lowercased
}

function normalizeHandle(h?: string | null): string {
  return (h || "").trim().replace(/^@/, "").toLowerCase();
}

function hostOf(u?: string | null): string {
  if (!u) return "";
  try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; }
}

function buildIdentity(p: any): Identity {
  const name = (p?.legal_name || p?.stage_name || p?.full_name || "").toLowerCase().trim();
  const tokens = name.split(/\s+/).filter(Boolean);
  const aka: string[] = Array.isArray(p?.aka_names)
    ? p.aka_names.map((s: string) => (s || "").toLowerCase().trim()).filter(Boolean)
    : [];
  const trusted = new Set<string>();
  const imdbHost = hostOf(p?.imdb_url);
  if (imdbHost) trusted.add(imdbHost);
  // Always trust the user's own owned platforms (handled per-platform below too).
  return {
    fullName: name,
    nameTokens: tokens,
    lastName: tokens[tokens.length - 1] || "",
    akaNames: aka,
    instagram: normalizeHandle(p?.instagram_handle),
    tiktok: normalizeHandle(p?.tiktok_handle),
    youtube: normalizeHandle(p?.youtube_handle),
    trustedDomains: trusted,
    profession: (p?.profession || "").toLowerCase().trim(),
  };
}

function hasPersonaContext(haystack: string, id: Identity): boolean {
  if (id.profession && haystack.includes(id.profession)) return true;
  return PERSONA_KEYWORDS.some((k) => haystack.includes(k));
}

function hasFullName(haystack: string, id: Identity): boolean {
  if (!id.fullName) return false;
  if (haystack.includes(id.fullName)) return true;
  return id.akaNames.some((a) => a && haystack.includes(a));
}

function gradeRelevance(m: Mention, id: Identity): { tag: RelevanceTag; reason: string } | null {
  const url = (m.url || "").toLowerCase();
  const title = (m.title || "").toLowerCase();
  const host = hostOf(url);
  const hay = `${title} ${url}`;

  // No identity loaded yet — be permissive but mark as needs review.
  if (!id.fullName && !id.instagram && !id.tiktok && !id.youtube) {
    return { tag: "needs_review", reason: "No profile identity loaded" };
  }

  const type = m.mention_type;

  // --- Instagram ---
  if (type === "social_instagram") {
    if (id.instagram) {
      // URL form: instagram.com/<handle> or @<handle> in title
      if (url.includes(`instagram.com/${id.instagram}`) || hay.includes(`@${id.instagram}`)) {
        return { tag: "verified", reason: "Your saved Instagram handle" };
      }
    }
    if (hasFullName(hay, id) && hasPersonaContext(hay, id)) {
      return { tag: "likely", reason: "Name + actor context" };
    }
    return null; // drop unrelated same-name accounts
  }

  // --- TikTok ---
  if (type === "social_tiktok") {
    if (id.tiktok && (url.includes(`tiktok.com/@${id.tiktok}`) || hay.includes(`@${id.tiktok}`))) {
      return { tag: "verified", reason: "Your saved TikTok handle" };
    }
    if (hasFullName(hay, id) && hasPersonaContext(hay, id)) {
      return { tag: "likely", reason: "Name + actor context" };
    }
    return null;
  }

  // --- YouTube / video ---
  if (type === "youtube") {
    if (id.youtube && (url.includes(`/@${id.youtube}`) || url.includes(`youtube.com/${id.youtube}`))) {
      return { tag: "verified", reason: "Your saved YouTube channel" };
    }
    if (hasFullName(hay, id) && hasPersonaContext(hay, id)) {
      return { tag: "likely", reason: "Name + actor context" };
    }
    if (hasFullName(hay, id)) {
      return { tag: "needs_review", reason: "Name match, weak context" };
    }
    return null;
  }

  // --- Photo matches (Yandex etc) ---
  if (PHOTO_TYPES.has(type)) {
    // Trusted reference hosts always pass.
    const TRUSTED_IMG_HOSTS = ["imdb.com", "m.media-amazon.com", "wikipedia.org", "wikimedia.org"];
    if (TRUSTED_IMG_HOSTS.some((d) => host === d || host.endsWith("." + d))) {
      return { tag: "verified", reason: "Trusted photo source" };
    }
    if (id.trustedDomains.has(host)) {
      return { tag: "verified", reason: "Your linked site" };
    }
    // Photo matches come from reverse-image search → keep for review.
    return { tag: "needs_review", reason: "Image match — verify it's you" };
  }

  // --- Web / news ---
  if (WEB_TYPES.has(type)) {
    if (id.trustedDomains.has(host)) {
      return { tag: "verified", reason: "Your linked site" };
    }
    if (hasFullName(hay, id) && hasPersonaContext(hay, id)) {
      return { tag: "likely", reason: "Name + actor context" };
    }
    return null; // drop generic web noise
  }

  // --- Deepfake ---
  if (DEEPFAKE_TYPES.has(type)) {
    return { tag: "ai_alert", reason: "AI / deepfake signal" };
  }

  // --- Impersonation (handle scanner) ---
  if (IMPERSONATION_TYPES.has(type)) {
    return { tag: "ai_alert", reason: "Account found on platform you haven't registered" };
  }
  if (SOCIAL_KNOWN_TYPES.has(type)) {
    return { tag: "verified", reason: "Your registered handle" };
  }

  // Unknown types → needs review if there's any name match.
  if (hasFullName(hay, id)) return { tag: "needs_review", reason: "Name match" };
  return null;
}


function StatusBadge({ verdict, relevance }: { verdict: Verdict; relevance?: RelevanceTag }) {
  // User verdict takes precedence
  if (verdict !== "informational") {
    const map: Record<"legitimate" | "threat", { label: string; cls: string }> = {
      legitimate: { label: "Legitimate", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" },
      threat: { label: "New Alert", cls: "bg-destructive/15 text-destructive border-destructive/40" },
    };
    const { label, cls } = map[verdict as "legitimate" | "threat"];
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>
        {label}
      </span>
    );
  }
  const r = relevance || "needs_review";
  const map: Record<RelevanceTag, { label: string; cls: string }> = {
    verified: { label: "Verified Match", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40" },
    likely: { label: "Likely You", cls: "bg-primary/15 text-primary border-primary/40" },
    needs_review: { label: "Needs Review", cls: "bg-amber-500/15 text-amber-500 border-amber-500/40" },
    ai_alert: { label: "AI/Deepfake Alert", cls: "bg-destructive/15 text-destructive border-destructive/40" },
  };
  const { label, cls } = map[r];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${cls}`}>
      {label}
    </span>
  );
}


function MentionRow({
  m,
  verdict,
  onVerdict,
}: {
  m: Mention;
  verdict: Verdict;
  onVerdict: (v: Verdict) => void;
}) {
  const Icon = iconFor(m.mention_type);
  const domain = extractDomain(m.url);
  const encodedUrl = encodeURIComponent(m.url || "");

  return (
    <div className="rounded-lg border border-border/20 bg-background/30 hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug break-words">
            {m.title || domain || "Untitled"}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
            <StatusBadge verdict={verdict} relevance={m.relevance} />
            <span className="uppercase tracking-wider text-primary/80 text-[10px]">
              {m.mention_type}
            </span>
            {domain && <span>· {domain}</span>}
            <span>· {new Date(m.found_at).toLocaleDateString()}</span>
            {m.relevance_reason && (
              <span className="text-muted-foreground/70">· {m.relevance_reason}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className={`h-8 w-8 ${verdict === "legitimate" ? "text-emerald-500" : "text-muted-foreground"}`}
            onClick={() => onVerdict(verdict === "legitimate" ? "informational" : "legitimate")}
            title="Mark as legitimate"
            aria-label="Mark as legitimate"
          >
            <ThumbsUp className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className={`h-8 w-8 ${verdict === "threat" ? "text-destructive" : "text-muted-foreground"}`}
            onClick={() => onVerdict(verdict === "threat" ? "informational" : "threat")}
            title="Mark as threat"
            aria-label="Mark as threat"
          >
            <ThumbsDown className="w-4 h-4" />
          </Button>
          {m.url && (
            <Button
              asChild
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              title="Preview source"
              aria-label="Preview source"
            >
              <a href={m.url} target="_blank" rel="noopener noreferrer">
                <Eye className="w-4 h-4" />
              </a>
            </Button>
          )}
          {m.url && (
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex h-8 w-8 items-center justify-center text-muted-foreground/60 hover:text-primary"
              title="Open"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
      {verdict === "threat" && (
        <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="destructive" className="gap-1.5">
            <Link to={`/dashboard/dmca?url=${encodedUrl}`}>
              <FileText className="w-3.5 h-3.5" /> Generate DMCA Notice
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/tools/contracts?type=cease-desist&url=${encodedUrl}`}>
              <Gavel className="w-3.5 h-3.5" /> Cease & Desist
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/dashboard/violations?url=${encodedUrl}`}>
              <Flag className="w-3.5 h-3.5" /> Report Violation
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  items,
  Icon,
  verdicts,
  setVerdict,
}: {
  title: string;
  items: Mention[];
  Icon: any;
  verdicts: Record<string, Verdict>;
  setVerdict: (id: string, v: Verdict) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5 md:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">{title}</h2>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full border border-primary/30 text-primary/80 bg-primary/5">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No results in this category.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((m) => (
            <MentionRow
              key={m.id}
              m={m}
              verdict={verdicts[m.id] || "informational"}
              onVerdict={(v) => setVerdict(m.id, v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const EMPTY_IDENTITY: Identity = {
  fullName: "", nameTokens: [], lastName: "", akaNames: [],
  instagram: "", tiktok: "", youtube: "",
  trustedDomains: new Set(), profession: "",
};

const Monitoring = () => {
  const { user } = useAuth();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorId, setActorId] = useState<string>(DEFAULT_ACTOR_ID);
  const [identity, setIdentity] = useState<Identity>(EMPTY_IDENTITY);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(() => loadVerdicts());

  const setVerdict = useCallback((id: string, v: Verdict) => {
    setVerdicts((prev) => {
      const next = { ...prev, [id]: v };
      saveVerdicts(next);
      return next;
    });
  }, []);

  const fetchMentions = useCallback(async (id: string, ident: Identity) => {
    setLoading(true);
    setError(null);

    const normalize = (raw: any): Mention[] => {
      const list =
        (Array.isArray(raw?.mentions) && raw.mentions) ||
        (Array.isArray(raw?.results) && raw.results) ||
        (Array.isArray(raw?.data) && raw.data) ||
        (Array.isArray(raw) && raw) ||
        [];
      return list.map((m: any, i: number) => ({
        id: m.id ?? m.uuid ?? `${i}-${m.url ?? m.link ?? Math.random()}`,
        mention_type: m.mention_type ?? m.type ?? m.source ?? "web",
        title: m.title ?? m.name ?? m.text ?? null,
        url: m.url ?? m.link ?? null,
        found_at: m.found_at ?? m.created_at ?? m.timestamp ?? new Date().toISOString(),
        status: m.status ?? null,
        actor_name: m.actor_name ?? null,
      }));
    };

    const applyRelevance = (raw: Mention[]): Mention[] => {
      const out: Mention[] = [];
      for (const m of raw) {
        if (isJunkMention(m)) continue;
        const grade = gradeRelevance(m, ident);
        if (!grade) continue; // drop irrelevant
        out.push({ ...m, relevance: grade.tag, relevance_reason: grade.reason });
      }
      return out;
    };

    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "mentions-proxy",
        { body: { actor: id } },
      );
      if (fnErr) throw fnErr;
      const rawList = normalize(data);
      const list = applyRelevance(rawList);

      // Also pull handle-scanner results written directly to the mentions table
      // by the VPS backend (mention_type: 'possible_impersonation' | 'social_known').
      try {
        if (user) {
          const { data: dbRows } = await supabase
            .from("mentions")
            .select("id, mention_type, title, url, found_at, status")
            .eq("user_id", user.id)
            .in("mention_type", ["possible_impersonation", "social_known"])
            .order("found_at", { ascending: false })
            .limit(200);
          if (Array.isArray(dbRows)) {
            for (const r of dbRows) {
              const tag: RelevanceTag = r.mention_type === "possible_impersonation" ? "ai_alert" : "verified";
              list.push({
                id: r.id,
                mention_type: r.mention_type,
                title: r.title,
                url: r.url,
                found_at: r.found_at,
                status: r.status,
                relevance: tag,
                relevance_reason: tag === "ai_alert"
                  ? "Account found on platform you haven't registered"
                  : "Your registered handle",
              });
            }
          }
        }
      } catch (e) {
        console.warn("[Monitoring] handle-scanner fetch failed:", e);
      }

      setMentions(list);
      console.log(`[Monitoring] ${rawList.length} raw → ${list.length} relevant for ${id}`);


      // Run Sightengine only on photos that already passed relevance.
      const photoUrls = list
        .filter((m) => PHOTO_TYPES.has(m.mention_type) && m.url)
        .map((m) => m.url as string)
        .slice(0, 25);
      if (photoUrls.length > 0) {
        supabase.functions
          .invoke("deepfake-batch", { body: { urls: photoUrls } })
          .then(({ data: dfData, error: dfErr }) => {
            if (dfErr || !dfData?.results) return;
            const flagged = (dfData.results as any[]).filter((r) => r.flagged);
            if (flagged.length === 0) return;
            const byUrl = new Map(list.map((m) => [m.url, m]));
            const deepfakeMentions: Mention[] = flagged.map((r, i) => {
              const src = byUrl.get(r.url);
              const score = Math.round(Math.max(r.deepfakeScore, r.aiGenScore) * 100);
              return {
                id: `deepfake-${i}-${r.url}`,
                mention_type: "deepfake",
                title: src?.title
                  ? `${src.title} — ${score}% AI/deepfake match`
                  : `Possible deepfake (${score}% confidence)`,
                url: r.url,
                found_at: new Date().toISOString(),
                status: "New Alert",
                actor_name: src?.actor_name ?? null,
                relevance: "ai_alert",
                relevance_reason: `${score}% confidence`,
              };
            });
            console.log(`[Monitoring] flagged ${deepfakeMentions.length} deepfakes via Sightengine`);
            setMentions((prev) => [...prev, ...deepfakeMentions]);
          })
          .catch((e) => console.warn("[Monitoring] deepfake-batch failed:", e));
      }
    } catch (err: any) {
      console.error("[Monitoring] proxy fetch failed:", err);
      setError(err?.message || "Failed to load mentions");
      setMentions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);


  // Resolve actor id + identity from profile, then fetch once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let id = DEFAULT_ACTOR_ID;
      let ident: Identity = EMPTY_IDENTITY;
      try {
        const params = new URLSearchParams(window.location.search);
        const override = params.get("actor");
        if (override) id = override;
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select(
              "external_actor_id, legal_name, stage_name, full_name, aka_names, instagram_handle, tiktok_handle, youtube_handle, imdb_url, profession",
            )
            .eq("user_id", user.id)
            .maybeSingle();
          if (data) {
            ident = buildIdentity(data);
            const profileId = (data as any).external_actor_id;
            if (!override && profileId) id = profileId;
          }
        }
      } catch {
        /* fall through to defaults */
      }
      if (cancelled) return;
      setActorId(id);
      setIdentity(ident);
      fetchMentions(id, ident);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, fetchMentions]);


  const photo = mentions.filter((m) => PHOTO_TYPES.has(m.mention_type));
  const video = mentions.filter((m) => VIDEO_TYPES.has(m.mention_type));
  const social = mentions.filter((m) => SOCIAL_TYPES.has(m.mention_type));
  const web = mentions.filter((m) => WEB_TYPES.has(m.mention_type));
  const deepfake = mentions.filter((m) => DEEPFAKE_TYPES.has(m.mention_type));
  const voice = mentions.filter((m) => VOICE_TYPES.has(m.mention_type));
  const writing = mentions.filter((m) => WRITING_TYPES.has(m.mention_type));

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-2">
            The <span className="text-primary">Scanner</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            What we found across the web and social media for your mapped
            identity.
          </p>
        </div>

        <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-5 md:p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Live Results
              </p>
              <p className="text-lg font-semibold">
                {loading ? "Loading…" : `${mentions.length} mention${mentions.length === 1 ? "" : "s"}`}
              </p>
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> {error}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={() => fetchMentions(actorId, identity)}
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Section title="Photo Matches" items={photo} Icon={ImageIcon} verdicts={verdicts} setVerdict={setVerdict} />
        <Section title="Social Media / Video" items={video} Icon={Video} verdicts={verdicts} setVerdict={setVerdict} />
        <Section title="Social Media" items={social} Icon={Instagram} verdicts={verdicts} setVerdict={setVerdict} />
        <Section title="Web Mentions" items={web} Icon={Globe} verdicts={verdicts} setVerdict={setVerdict} />
        <Section title="Deepfake Detection" items={deepfake} Icon={ScanFace} verdicts={verdicts} setVerdict={setVerdict} />
        <Section title="Voice Clones" items={voice} Icon={Mic} verdicts={verdicts} setVerdict={setVerdict} />
        <Section title="Writing Plagiarism" items={writing} Icon={PenLine} verdicts={verdicts} setVerdict={setVerdict} />

      </div>
    </DashboardLayout>
  );
};

export default Monitoring;
