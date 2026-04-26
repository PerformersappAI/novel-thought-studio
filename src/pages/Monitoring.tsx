import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye, AlertTriangle, ShieldCheck, Radar, ArrowRight, Lock, Music2,
  Instagram, Facebook, Youtube, Twitter, Image as ImageIcon, Megaphone, Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Simple stand-in for Pro entitlement until billing wires it up.
// Today: every authenticated user is treated as "free" by default.
// Toggle this to true for any user with an active subscription once available.
const useIsPro = () => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    if (!user) return;
    // Best-effort: check for an active subscription row.
    supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => setIsPro(!!data));
  }, [user]);
  return isPro;
};

const PLATFORMS = [
  { name: "TikTok", icon: Music2, status: "active" },
  { name: "Instagram", icon: Instagram, status: "active" },
  { name: "Facebook", icon: Facebook, status: "active" },
  { name: "YouTube", icon: Youtube, status: "active" },
  { name: "X / Twitter", icon: Twitter, status: "active" },
  { name: "Stock Sites", icon: ImageIcon, status: "pending" },
  { name: "Ad Networks", icon: Megaphone, status: "pending" },
] as const;

const ALERT_STATUS_STYLES: Record<string, string> = {
  New: "bg-[#C0392B]/15 text-[#C0392B] border-[#C0392B]/40",
  "Under Review": "bg-[#C9A84C]/15 text-[#C9A84C] border-[#C9A84C]/40",
  "Takedown Filed": "bg-blue-500/15 text-blue-400 border-blue-500/40",
  Resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
};

const Monitoring = () => {
  const { user } = useAuth();
  const isPro = useIsPro();
  const [stats, setStats] = useState({ facesMonitored: 0, scansThisMonth: 0, alerts: 0, takedowns: 0 });
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [{ count: faces }, { data: scans }, { count: monthScans }, { count: violations }, { data: lastScanData }] = await Promise.all([
        supabase.from("registry_assets").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "approved"),
        supabase.from("likeness_scans").select("results, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("likeness_scans").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()),
        supabase.from("reported_violations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("likeness_scans").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      // Build alert list from latest scan results (best-effort shape)
      const flat: any[] = [];
      (scans ?? []).forEach((s: any) => {
        const arr = Array.isArray(s.results) ? s.results : [];
        arr.slice(0, 3).forEach((r: any) => {
          flat.push({
            date: s.created_at,
            platform: r.source || r.platform || "Web",
            type: r.alertType || "Unauthorized Face Detected",
            status: r.status || "New",
            url: r.url,
          });
        });
      });

      setStats({
        facesMonitored: faces ?? 0,
        scansThisMonth: monthScans ?? 0,
        alerts: flat.filter((a) => a.status === "New").length,
        takedowns: violations ?? 0,
      });
      setAlerts(flat.slice(0, 8));
      setLastScan(lastScanData?.created_at ?? null);
    };
    load();
  }, [user]);

  const statCards = [
    { label: "Faces Monitored", value: stats.facesMonitored, icon: Eye },
    { label: "Scans This Month", value: stats.scansThisMonth, icon: Radar },
    { label: "Active Alerts", value: stats.alerts, icon: AlertTriangle },
    { label: "Takedowns Filed", value: stats.takedowns, icon: ShieldCheck },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Monitoring</h1>
            <p className="text-muted-foreground mt-1">Cross-platform face & likeness protection.</p>
          </div>
          {isPro ? (
            <Badge className="bg-[#C0392B]/15 text-[#C0392B] border border-[#C0392B]/40">Pro Active</Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s) => (
            <Card key={s.label} className="glass-card border-border/30">
              <CardContent className="p-5">
                <s.icon className="w-5 h-5 text-[#C0392B] mb-3" />
                <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Free user lock */}
        {!isPro && (
          <Card className="border-2 border-[#C0392B] bg-gradient-to-br from-[#C0392B]/15 via-[#C0392B]/5 to-transparent mb-6">
            <CardContent className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#C0392B] flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Active face monitoring requires Pro
              </h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                The only cross-platform face protection built for performers.
              </p>
              <p className="text-sm text-[#C9A84C] mt-3 font-medium">
                YouTube monitors YouTube only. ClaimMyFace monitors 7 platforms.
              </p>
              <Link to="/#pricing">
                <Button className="mt-6 bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
                  Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Platform grid */}
        <Card className="glass-card border-border/30 mb-6">
          <CardHeader>
            <CardTitle className="font-display text-lg">Platform Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {PLATFORMS.map((p) => {
                const active = isPro && p.status === "active";
                return (
                  <div
                    key={p.name}
                    className="p-4 rounded-lg bg-secondary/30 border border-border/30 flex flex-col items-center text-center gap-2"
                  >
                    <p.icon className="w-6 h-6 text-foreground" />
                    <div className="text-xs font-medium text-foreground">{p.name}</div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          active ? "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60" : "bg-muted-foreground/40"
                        }`}
                      />
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {active ? "Active" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Scan activity + actions */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card border-border/30 lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-lg">Scan Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last scan</span>
                <span className="text-foreground font-medium">
                  {lastScan ? new Date(lastScan).toLocaleString() : "No scans yet"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Scans this month</span>
                <span className="text-foreground font-medium">{stats.scansThisMonth}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Assets being monitored</span>
                <span className="text-foreground font-medium">{stats.facesMonitored}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/tools/dmca" className="block">
                <Button className="w-full bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
                  Generate DMCA Notice
                </Button>
              </Link>
              <Link to="/tools/contracts" className="block">
                <Button variant="outline" className="w-full">Send Cease & Desist</Button>
              </Link>
              <Link to="/dashboard/violations" className="block">
                <Button variant="outline" className="w-full">Report to Platform</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Alerts table */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C0392B]" /> Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No alerts yet. Run a scan from Likeness Monitor to populate this feed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border/30">
                    <tr>
                      <th className="text-left py-2 pr-4">Date</th>
                      <th className="text-left py-2 pr-4">Platform</th>
                      <th className="text-left py-2 pr-4">Alert Type</th>
                      <th className="text-left py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((a, i) => (
                      <tr key={i} className="border-b border-border/20 last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(a.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4 text-foreground">{a.platform}</td>
                        <td className="py-3 pr-4 text-foreground">{a.type}</td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-1 rounded-md border ${ALERT_STATUS_STYLES[a.status] || ALERT_STATUS_STYLES.New}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default Monitoring;
