import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, ShieldCheck } from "lucide-react";

interface Report {
  id: string;
  user_id: string;
  scan_type: string;
  query_label: string | null;
  period_month: string;
  summary: any;
  created_at: string;
  source_scan_id: string | null;
}

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });

const ScanReports = () => {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminView, setAdminView] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      let q = supabase.from("scan_reports").select("*").order("created_at", { ascending: false }).limit(200);
      if (!(isAdmin && adminView)) q = q.eq("user_id", user.id);
      const { data } = await q;
      setReports((data as any) || []);
      setLoading(false);
    })();
  }, [user, isAdmin, adminView]);

  const grouped = useMemo(() => {
    const m = new Map<string, Report[]>();
    for (const r of reports) {
      const key = r.period_month;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(r);
    }
    return Array.from(m.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [reports]);

  const downloadJson = (r: Report) => {
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scan-report-${r.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" /> Scan Reports
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              A scrubbed summary is saved every time you run a scan — no URLs or personal data, just the
              numbers — so you can compare month over month.
            </p>
          </div>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setAdminView((v) => !v)}>
              <ShieldCheck className="w-4 h-4 mr-2" />
              {adminView ? "Showing: All users" : "Showing: Mine only"}
            </Button>
          )}
        </div>

        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">Loading…</Card>
        ) : grouped.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No scan reports yet. Run a scan to generate your first snapshot.</p>
          </Card>
        ) : (
          grouped.map(([month, items]) => {
            const totals = items.reduce(
              (acc, r) => acc + (r.summary?.total_results || 0),
              0,
            );
            return (
              <div key={month} className="space-y-3">
                <div className="flex items-baseline justify-between border-b border-border/30 pb-2">
                  <h2 className="font-display text-lg font-semibold">{monthLabel(month)}</h2>
                  <span className="text-xs text-muted-foreground">
                    {items.length} scan{items.length === 1 ? "" : "s"} · {totals} total results
                  </span>
                </div>
                <div className="grid gap-3">
                  {items.map((r) => {
                    const s = r.summary || {};
                    const cats = Object.entries(s.by_category || {}) as [string, number][];
                    return (
                      <Card key={r.id} className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="capitalize">{r.scan_type.replace(/_/g, " ")}</Badge>
                              {r.query_label && (
                                <span className="text-sm font-medium text-foreground truncate">"{r.query_label}"</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(r.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => downloadJson(r)}>
                            <Download className="w-4 h-4 mr-1" /> JSON
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-center">
                          <Stat label="Total" value={s.total_results ?? 0} />
                          <Stat label="High risk" value={s.by_risk?.high ?? 0} tone="destructive" />
                          <Stat label="Medium" value={s.by_risk?.medium ?? 0} />
                          <Stat label="With image" value={s.results_with_image ?? 0} />
                        </div>
                        {cats.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {cats.map(([k, v]) => (
                              <Badge key={k} variant="outline" className="text-xs capitalize">
                                {k}: {v}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {isAdmin && adminView && (
                          <p className="text-[10px] text-muted-foreground mt-3 font-mono">user: {r.user_id}</p>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
};

const Stat = ({ label, value, tone }: { label: string; value: number; tone?: "destructive" }) => (
  <div className="rounded-lg border border-border/30 bg-secondary/20 p-2">
    <div className={`text-xl font-bold ${tone === "destructive" ? "text-destructive" : "text-foreground"}`}>{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

export default ScanReports;
