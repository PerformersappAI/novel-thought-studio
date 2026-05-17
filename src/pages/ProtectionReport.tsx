import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  id: string;
  mention_type: string;
  title: string;
  url: string | null;
  status: string;
  found_at: string;
}

function statusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("legitimate")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (s.includes("threat")) return "bg-destructive/15 text-destructive border-destructive/30";
  if (s.includes("voice_match")) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  if (s.includes("writing_review") || s.includes("review")) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  if (s.includes("match")) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  return "bg-secondary/40 text-muted-foreground border-border/40";
}

const ProtectionReport = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("mentions")
        .select("id, mention_type, title, url, status, found_at")
        .eq("user_id", user.id)
        .order("found_at", { ascending: false });
      setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, [user]);

  const legitimate = useMemo(
    () => rows.filter((r) => r.status?.toLowerCase().includes("legitimate")),
    [rows]
  );
  const needsReview = useMemo(
    () =>
      rows.filter((r) => {
        const s = r.status?.toLowerCase() || "";
        return s.includes("threat") || s.includes("review") || s.includes("match") || s.includes("alert");
      }),
    [rows]
  );

  const renderRow = (r: Row) => (
    <div
      key={r.id}
      className="rounded-xl border border-border/30 bg-card/40 p-4 flex items-start gap-3"
    >
      <div className="flex-1 min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {r.mention_type}
        </div>
        <div className="font-medium text-foreground mt-0.5 truncate">{r.title || "Untitled"}</div>
        <div className="text-xs text-muted-foreground mt-1">
          Found {new Date(r.found_at).toLocaleDateString()}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass(r.status || "")}`}>
          {r.status}
        </span>
        {r.url && (
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            Open <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Protection Status Report</h1>
          <p className="text-muted-foreground mt-1">
            Everything our scanner has found about you, sorted by what's safe and what may need action.
          </p>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="font-display text-xl font-semibold">
                  Known / Legitimate Presence
                  <span className="ml-2 text-sm text-muted-foreground font-body">
                    ({legitimate.length})
                  </span>
                </h2>
              </div>
              {legitimate.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border/30 bg-card/30 p-4">
                  No legitimate appearances logged yet. Once you confirm a result as legitimate, it
                  will appear here.
                </p>
              ) : (
                <div className="space-y-2">{legitimate.map(renderRow)}</div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h2 className="font-display text-xl font-semibold">
                  Needs Your Review
                  <span className="ml-2 text-sm text-muted-foreground font-body">
                    ({needsReview.length})
                  </span>
                </h2>
              </div>
              {needsReview.length > 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Did you authorize this? If not, this may be unauthorized use of your identity.
                </p>
              )}
              {needsReview.length === 0 ? (
                <p className="text-sm text-muted-foreground rounded-xl border border-border/30 bg-card/30 p-4">
                  Nothing flagged. We'll alert you the moment something appears.
                </p>
              ) : (
                <div className="space-y-2">{needsReview.map(renderRow)}</div>
              )}
            </section>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ProtectionReport;
