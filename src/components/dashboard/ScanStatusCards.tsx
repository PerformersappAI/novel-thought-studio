import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
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
  { key: "elevenlabs_voice", label: "Voice Clones", emoji: "🎙️", itemsLabel: "voices" },
  { key: "writing", label: "Writing Plagiarism", emoji: "✍️", itemsLabel: "articles" },
  { key: "deepfake", label: "Deepfake Video", emoji: "🎬", itemsLabel: "videos" },
  { key: "social", label: "Social Impersonators", emoji: "👥", itemsLabel: "profiles" },
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

        if (rows.length > 0) {
          if (!cancelled) {
            setRuns(indexRuns(rows));
            setLoading(false);
          }
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => {
          const run = runs[normalizeScannerName(cat.key)];
          const inactive = cat.planned && !run;
          const noRun = !run;
          const hasThreats = !!run && run.status === "completed" && run.threats_found > 0;

          let body: React.ReactNode;
          let tone = "border-border/30 bg-secondary/20";
          let badge: React.ReactNode = null;

          if (noRun) {
            body = (
              <p className="text-sm text-muted-foreground">
                Monitoring active — no recent scan yet
              </p>
            );
            tone = "border-border/30 bg-secondary/20";
          } else if (run!.status === "running") {
            body = (
              <p className="text-sm text-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Scan in progress... started {timeAgo(run!.started_at)}
              </p>
            );
            tone = "border-primary/30 bg-primary/5";
            badge = (
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
                Scanning
              </span>
            );
          } else if (run!.status === "failed") {
            body = (
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Last scan failed {timeAgo(run!.started_at)} — please contact support
              </p>
            );
            tone = "border-destructive/30 bg-destructive/5";
          } else if (hasThreats) {
            body = (
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-muted-foreground">Last scan:</span>{" "}
                {timeAgo(run!.started_at)} — {run!.items_scanned} {cat.itemsLabel} checked —{" "}
                <span className="text-destructive font-semibold">{run!.threats_found} threats</span>
              </p>
            );
            tone = "border-destructive/40 bg-destructive/5 hover:bg-destructive/10";
            badge = (
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-destructive/15 text-destructive border border-destructive/40">
                Alert
              </span>
            );
          } else {
            body = (
              <p className="text-sm text-foreground leading-relaxed">
                <span className="text-muted-foreground">Last scan:</span>{" "}
                {timeAgo(run!.started_at)} — {run!.items_scanned} {cat.itemsLabel} checked — {run!.legitimate_found} verified
              </p>
            );
            tone = "border-emerald-500/30 bg-emerald-500/5";
            badge = (
              <span className="px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                Clean
              </span>
            );
          }

          const cardInner = (
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{cat.emoji}</span>
                <span className="font-semibold text-base text-foreground">{cat.label}</span>
                {inactive && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground border border-border/30 rounded px-1.5 py-0.5">
                    Planned
                  </span>
                )}
                {!inactive && badge && <span className="ml-auto flex items-center gap-1">{badge}{hasThreats && <ChevronRight className="w-4 h-4 text-destructive" />}</span>}
              </div>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : (
                body
              )}
            </>
          );

          if (hasThreats) {
            return (
              <Link
                key={cat.key}
                to="/dashboard/monitoring"
                className={`block rounded-xl border p-5 transition-colors cursor-pointer ${tone}`}
              >
                {cardInner}
              </Link>
            );
          }

          return (
            <div
              key={cat.key}
              className={`rounded-xl border p-5 transition-colors ${tone}`}
            >
              {cardInner}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ScanStatusCards;
