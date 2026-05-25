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
} from "lucide-react";
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

const PHOTO_TYPES = new Set(["image_yandex"]);
const SOCIAL_TYPES = new Set(["social_instagram", "social_tiktok", "youtube"]);
const WEB_TYPES = new Set(["web", "news"]);

function extractDomain(url?: string | null) {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
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

function MentionRow({ m }: { m: Mention }) {
  const Icon = iconFor(m.mention_type);
  const domain = extractDomain(m.url);
  return (
    <a
      href={m.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-4 py-3 rounded-lg border border-border/20 bg-background/30 hover:border-primary/40 hover:bg-primary/5 transition-colors group"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-snug break-words">
          {m.title || domain || "Untitled"}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider text-primary/80 text-[10px]">
            {m.mention_type}
          </span>
          {domain && <span>· {domain}</span>}
          <span>· {new Date(m.found_at).toLocaleDateString()}</span>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary shrink-0 mt-1" />
    </a>
  );
}

function Section({
  title,
  items,
  Icon,
}: {
  title: string;
  items: Mention[];
  Icon: any;
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
            <MentionRow key={m.id} m={m} />
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
      const list = normalize(data);
      setMentions(list);
      console.log(`[Monitoring] loaded ${list.length} mentions for ${id}`);
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
  const social = mentions.filter((m) => SOCIAL_TYPES.has(m.mention_type));
  const web = mentions.filter((m) => WEB_TYPES.has(m.mention_type));

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

        <Section title="Photo Matches" items={photo} Icon={ImageIcon} />
        <Section title="Social Media" items={social} Icon={Instagram} />
        <Section title="Web Mentions" items={web} Icon={Globe} />
      </div>
    </DashboardLayout>
  );
};

export default Monitoring;
