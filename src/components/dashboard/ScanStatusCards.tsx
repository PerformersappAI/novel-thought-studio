import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ScanRun {
  id: string;
  scanner_name: string;
  actor_id: string | null;
  started_at: string;
  finished_at: string | null;
  items_scanned: number;
  threats_found: number;
  legitimate_found: number;
  review_found: number;
  status: string;
  notes: string | null;
}

interface Category {
  key: string;
  label: string;
  emoji: string;
  itemsLabel: string;
  planned?: boolean;
}

const CATEGORIES: Category[] = [
  { key: "face_match", label: "Photo Matches", emoji: "📸", itemsLabel: "images" },
  { key: "elevenlabs_voice", label: "Voice Clones (ElevenLabs)", emoji: "🎙️", itemsLabel: "voices" },
  { key: "writing", label: "Writing Plagiarism", emoji: "✍️", itemsLabel: "articles" },
  { key: "deepfake", label: "Deepfake Video", emoji: "🎬", itemsLabel: "videos", planned: true },
  { key: "social", label: "Social Impersonators", emoji: "👥", itemsLabel: "profiles", planned: true },
];

const SCANNER_ALIASES: Record<string, string> = {
  face_match: "face_match",
  photo: "face_match",
  photos: "face_match",
  image: "face_match",
  images: "face_match",
  elevenlabs_voice: "elevenlabs_voice",
  voice: "elevenlabs_voice",
  voice_clone: "elevenlabs_voice",
  voice_clones: "elevenlabs_voice",
  writing: "writing",
  plagiarism: "writing",
  deepfake: "deepfake",
  social: "social",
};

function normalizeScannerName(value: string | null | undefined): string {
  const key = (value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return SCANNER_ALIASES[key] ?? key;
}

function indexRuns(rows: ScanRun[]): Record<string, ScanRun | null> {
  const latest: Record<string, ScanRun | null> = {};
  for (const row of rows) {
    const key = normalizeScannerName(row.scanner_name);
    if (!latest[key]) latest[key] = row;
  }
  return latest;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

interface Props {
  actorId: string | null;
}

const ScanStatusCards = ({ actorId }: Props) => {
  const { session, user, loading: authLoading } = useAuth();
  const [runs, setRuns] = useState<Record<string, ScanRun | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (authLoading) return;

      try {
        if (!session) {
          console.warn("[ScanStatusCards] No authenticated session; skipping scan_runs fetch");
          if (!cancelled) { setRuns({}); setLoading(false); }
          return;
        }

        const params = new URLSearchParams({
          select: "id,scanner_name,actor_id,started_at,finished_at,items_scanned,threats_found,legitimate_found,review_found,status,notes",
          order: "started_at.desc",
          limit: "50",
          _: Date.now().toString(),
        });
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/scan_runs?${params.toString()}`;
        const res = await fetch(url, {
          method: "GET",
          cache: "no-store",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const rows = await res.json() as ScanRun[];
        if (!res.ok) throw new Error(JSON.stringify(rows));
        console.log("[ScanStatusCards] authenticated scan_runs rows:", {
          user_id: user?.id,
          actor_id: actorId,
          count: rows.length,
          rows: rows.map((row) => ({ scanner_name: row.scanner_name, normalized: normalizeScannerName(row.scanner_name), actor_id: row.actor_id })),
        });

        if (rows.length > 0) {
          if (!cancelled) setRuns(indexRuns(rows));
          return;
        }

        const functionParams = new URLSearchParams({ action: "get_scan_runs", _: Date.now().toString() });
        if (actorId) functionParams.set("actor_id", actorId);
        const functionRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/actor-registry?${functionParams.toString()}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const functionJson = await functionRes.json();
        if (!functionRes.ok) throw new Error(JSON.stringify(functionJson));
        const functionRows = (functionJson?.scan_runs || []) as ScanRun[];
        console.log("[ScanStatusCards] actor-registry scan_runs fallback:", {
          actor_id: functionJson?.actor_id,
          count: functionRows.length,
          rows: functionRows.map((row) => ({ scanner_name: row.scanner_name, normalized: normalizeScannerName(row.scanner_name), actor_id: row.actor_id })),
        });
        if (!cancelled) {
          setRuns(indexRuns(functionRows));
        }
      } catch (error) {
        console.warn("[ScanStatusCards] Failed to fetch scan runs:", error);
      }
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [actorId, authLoading, session, user?.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/30 bg-card/40 p-6"
    >
      <h2 className="font-display text-lg font-semibold mb-4">Scan Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const run = runs[normalizeScannerName(cat.key)];
          const inactive = cat.planned && !run;
          const noRun = !run;

          let body: React.ReactNode;
          let tone = "border-border/30 bg-secondary/20";

          if (noRun) {
            body = (
              <p className="text-sm text-muted-foreground">
                Not yet active — scanner coming soon
              </p>
            );
            tone = "border-border/20 bg-secondary/10 opacity-60";
          } else if (run!.status === "running") {
            body = (
              <p className="text-sm text-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Scan in progress... started {timeAgo(run!.started_at)}
              </p>
            );
            tone = "border-primary/30 bg-primary/5";
          } else if (run!.status === "failed") {
            body = (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Last scan failed {timeAgo(run!.started_at)} — please contact support
              </p>
            );
            tone = "border-destructive/30 bg-destructive/5";
          } else {
            // success
            body = (
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-muted-foreground">Last scan:</span>{" "}
                {timeAgo(run!.started_at)} — {run!.items_scanned} {cat.itemsLabel} checked —{" "}
                <span className={run!.threats_found > 0 ? "text-destructive font-medium" : ""}>
                  {run!.threats_found} threats
                </span>{" "}
                — {run!.legitimate_found} verified{" "}
                <CheckCircle2 className="inline w-3.5 h-3.5 text-emerald-500 -mt-0.5" />
              </p>
            );
            tone = "border-border/30 bg-card/60";
          }

          return (
            <div
              key={cat.key}
              className={`rounded-xl border p-4 transition-colors ${tone}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{cat.emoji}</span>
                <span className="font-medium text-sm text-foreground">{cat.label}</span>
                {inactive && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground border border-border/30 rounded px-1.5 py-0.5">
                    Planned
                  </span>
                )}
              </div>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                body
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ScanStatusCards;
