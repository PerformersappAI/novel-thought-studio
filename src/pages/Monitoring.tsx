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
}

const PHOTO_TYPES = new Set(["image_yandex", "image"]);
const VIDEO_TYPES = new Set(["youtube"]);
const SOCIAL_TYPES = new Set(["social_instagram", "social_tiktok"]);
const WEB_TYPES = new Set(["web", "news"]);
const DEEPFAKE_TYPES = new Set(["deepfake"]);
const VOICE_TYPES = new Set(["voice"]);
const WRITING_TYPES = new Set(["writing"]);

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

function StatusBadge({ verdict }: { verdict: Verdict }) {
  const map: Record<Verdict, { label: string; cls: string }> = {
    informational: {
      label: "Informational",
      cls: "bg-muted/40 text-muted-foreground border-border",
    },
    legitimate: {
      label: "Legitimate",
      cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/40",
    },
    threat: {
      label: "New Alert",
      cls: "bg-destructive/15 text-destructive border-destructive/40",
    },
  };
  const { label, cls } = map[verdict];
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${cls}`}
    >
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
            <StatusBadge verdict={verdict} />
            <span className="uppercase tracking-wider text-primary/80 text-[10px]">
              {m.mention_type}
            </span>
            {domain && <span>· {domain}</span>}
            <span>· {new Date(m.found_at).toLocaleDateString()}</span>
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

const Monitoring = () => {
  const { user } = useAuth();
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actorId, setActorId] = useState<string>(DEFAULT_ACTOR_ID);
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(() => loadVerdicts());

  const setVerdict = useCallback((id: string, v: Verdict) => {
    setVerdicts((prev) => {
      const next = { ...prev, [id]: v };
      saveVerdicts(next);
      return next;
    });
  }, []);

  const fetchMentions = useCallback(async (id: string) => {
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

    // Use the edge function proxy — browser cannot call http:// from https://
    try {
      const { data, error: fnErr } = await supabase.functions.invoke(
        "mentions-proxy",
        { body: { actor: id } },
      );
      if (fnErr) throw fnErr;
      const list = normalize(data).filter((m) => !isJunkMention(m));
      setMentions(list);
      console.log(`[Monitoring] loaded ${list.length} mentions for ${id} (filtered)`);
    } catch (err: any) {
      console.error("[Monitoring] proxy fetch failed:", err);
      setError(err?.message || "Failed to load mentions");
      setMentions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Resolve actor id from profile (fallback to default), then fetch once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let id = DEFAULT_ACTOR_ID;
      try {
        const params = new URLSearchParams(window.location.search);
        const override = params.get("actor");
        if (override) {
          id = override;
        } else if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("external_actor_id")
            .eq("user_id", user.id)
            .maybeSingle();
          const profileId = (data as any)?.external_actor_id;
          if (profileId) id = profileId;
        }
      } catch {
        /* fall through to default */
      }
      if (cancelled) return;
      setActorId(id);
      fetchMentions(id);
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
            onClick={() => fetchMentions(actorId)}
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
