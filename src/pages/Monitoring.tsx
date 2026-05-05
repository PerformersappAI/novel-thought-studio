import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Eye, AlertTriangle, ShieldCheck, Radar, ArrowRight, Lock, Music2,
  Instagram, Facebook, Youtube, Twitter, Image as ImageIcon, Megaphone,
  Linkedin, Search, Globe, Briefcase, FileText, Clapperboard, Newspaper,
  ScanFace, Mic, Bot, MoreHorizontal, ExternalLink, Copy, Check, HelpCircle,
  RefreshCw, Trash2, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FILTER_TABS, MOCK_FINDINGS, STATUS_STYLES, type Finding, type FindingCategory,
} from "@/components/monitoring/findings";
import MonitoringTour, { TourStep } from "@/components/monitoring/MonitoringTour";
import FindingThumbnail from "@/components/monitoring/FindingThumbnail";
import TakedownCreditsCard from "@/components/monitoring/TakedownCreditsCard";
import ImpersonatorDetection from "@/components/monitoring/ImpersonatorDetection";
import { useToast } from "@/hooks/use-toast";

const useIsPro = () => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  useEffect(() => {
    if (!user) return;
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

const SOCIAL_PLATFORMS = [
  { name: "TikTok", icon: Music2 },
  { name: "Instagram", icon: Instagram },
  { name: "Facebook", icon: Facebook },
  { name: "YouTube", icon: Youtube },
  { name: "X / Twitter", icon: Twitter },
  { name: "LinkedIn", icon: Linkedin },
  { name: "Pinterest", icon: ImageIcon },
];

const WEB_PLATFORMS = [
  { name: "Google Image Search", icon: Search },
  { name: "Bing Image Search", icon: Search },
  { name: "Stock Sites", icon: ImageIcon },
  { name: "Ad Networks", icon: Megaphone },
  { name: "Fiverr", icon: Briefcase },
  { name: "Upwork", icon: Briefcase },
  { name: "Cameo", icon: Clapperboard },
  { name: "Reddit", icon: Globe },
  { name: "Content Platforms", icon: Globe },
  { name: "News & Articles", icon: Newspaper },
  { name: "Casting Platforms", icon: Clapperboard },
];

const AI_PLATFORMS = [
  { name: "Reality Defender Deepfake Scan", icon: ScanFace },
  { name: "AI Voice Clone Detection", icon: Mic },
  { name: "AI Avatar Detection", icon: Bot },
];

const PlatformTile = ({ name, Icon, locked }: { name: string; Icon: any; locked: boolean }) => (
  <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 flex flex-col items-center text-center gap-2">
    <Icon className="w-5 h-5 text-foreground" />
    <div className="text-xs font-medium text-foreground leading-tight">{name}</div>
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          locked ? "bg-muted-foreground/40" : "bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60"
        }`}
      />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {locked ? "Pro" : "Active"}
      </span>
    </div>
  </div>
);

interface MentionRow {
  id: string;
  mention_type: string;
  title: string;
  url: string | null;
  found_at: string;
  status: string;
  confidence: number | null;
  category: string | null;
  media_type: string | null;
  thumbnail_url: string | null;
  audio_url: string | null;
  excerpt: string | null;
  match_label: string | null;
}

const Monitoring = () => {
  const { user } = useAuth();
  const isPro = useIsPro();
  const { toast } = useToast();

  const [stats, setStats] = useState({ facesMonitored: 0, alerts: 0, takedowns: 0, alertsThisMonth: 0 });
  const [findings, setFindings] = useState<Finding[]>([]);
  const [mentions, setMentions] = useState<MentionRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTER_TABS)[number]>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [copied, setCopied] = useState(false);
  const [performerName, setPerformerName] = useState<string>("");
  const [registryId, setRegistryId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const scanAbortRef = useRef<AbortController | null>(null);

  // Tour
  const [tourOpen, setTourOpen] = useState(false);
  const coverageRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);

  const loadMentions = async () => {
    if (!user) return;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [{ count: faces }, { data: mentionsData }, { count: violations }, { data: prof }, { data: certs }] = await Promise.all([
      supabase.from("registry_assets").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "approved"),
      supabase.from("mentions").select("*").eq("user_id", user.id).order("found_at", { ascending: false }),
      supabase.from("reported_violations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("profiles").select("stage_name, legal_name, full_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("certificates").select("registry_id").eq("user_id", user.id).limit(1),
    ]);
    setPerformerName(prof?.stage_name || prof?.legal_name || prof?.full_name || "");
    setRegistryId(certs?.[0]?.registry_id ?? null);

    const rows: MentionRow[] = (mentionsData ?? []) as MentionRow[];
    setMentions(rows);

    const findingsFromMentions: Finding[] = rows.map((m) => ({
      id: m.id,
      platform: m.mention_type,
      finding: m.title,
      category: (m.category as FindingCategory) || "News & Articles",
      date: m.found_at,
      lastSeen: m.found_at,
      status: (m.status as Finding["status"]) || "New Alert",
      url: m.url || "#",
      confidence: m.confidence ?? 90,
      recommended: "Report to Platform" as const,
      mediaType: (m.media_type as Finding["mediaType"]) || "article",
      thumbnailUrl: m.thumbnail_url ?? undefined,
      audioUrl: m.audio_url ?? undefined,
      excerpt: m.excerpt ?? undefined,
      matchLabel: m.match_label ?? undefined,
    }));

    const data = findingsFromMentions;
    const newAlerts = data.filter((d) => d.status === "New Alert").length;
    const monthMs = monthStart.getTime();
    const alertsMonth = data.filter((d) => new Date(d.date).getTime() >= monthMs).length;

    setFindings(data);
    setStats({
      facesMonitored: faces ?? 0,
      alerts: newAlerts,
      takedowns: violations ?? 0,
      alertsThisMonth: alertsMonth,
    });
  };

  useEffect(() => {
    loadMentions();
  }, [user]);

  const runScan = async () => {
    if (scanning) {
      scanAbortRef.current?.abort();
      scanAbortRef.current = null;
      setScanning(false);
      toast({ title: "Scan stopped" });
      return;
    }
    setScanning(true);
    setScanDone(false);
    const controller = new AbortController();
    scanAbortRef.current = controller;
    try {
      await fetch("http://187.77.199.100:8001/scan", {
        method: "POST",
        signal: controller.signal,
      });
      setScanDone(true);
      toast({ title: "Scan complete", description: "Check your results below." });
      await loadMentions();
    } catch (err: any) {
      if (err.name === "AbortError") return;
      toast({ title: "Scan failed", description: String(err), variant: "destructive" });
    } finally {
      setScanning(false);
      scanAbortRef.current = null;
    }
  };

  // Auto-launch tour first time
  useEffect(() => {
    if (!isPro) return;
    const seen = localStorage.getItem("cmf_monitoring_tour_done");
    if (!seen) {
      const t = setTimeout(() => setTourOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, [isPro]);

  const filtered = useMemo(() => {
    return findings.filter((f) => {
      const matchesCat = filter === "All" || f.category === filter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q || f.platform.toLowerCase().includes(q) || f.finding.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [findings, filter, search]);

  const statCards = [
    { label: "Faces Monitored", value: stats.facesMonitored, icon: Eye },
    { label: "Platforms Scanned", value: 18, icon: Radar },
    { label: "Alerts This Month", value: isPro ? stats.alertsThisMonth : 0, icon: AlertTriangle },
    { label: "Takedowns Filed", value: stats.takedowns, icon: ShieldCheck },
  ];

  const tourSteps: TourStep[] = [
    { ref: coverageRef, title: "Your Scan Coverage", body: "This is every platform we watch for you — 24/7." },
    { ref: tableRef, title: "Your Identity Footprint", body: "Everywhere we found you online — the good, the bad, and the forgotten." },
    { ref: rowRef as any, title: "Tap any alert to see details", body: "Red alerts need your attention. Open a row to view the finding and take action." },
    { ref: filterRef, title: "Filter what matters", body: "Focus on deepfakes, fake profiles, ads, or anything else — your call." },
    { ref: actionRef as any, title: "One-tap takedowns", body: "File a DMCA notice in seconds — we do the heavy lifting." },
  ];

  const closeTour = () => {
    setTourOpen(false);
    localStorage.setItem("cmf_monitoring_tour_done", "1");
  };

  const handleAction = (f: Finding, action: string) => {
    toast({ title: action, description: `${action} initiated for ${f.platform}.` });
  };

  const deleteFinding = async (f: Finding) => {
    const { error } = await supabase.from("mentions").delete().eq("id", f.id);
    if (error) { toast({ title: "Failed to delete", variant: "destructive" }); return; }
    setFindings(prev => prev.filter(x => x.id !== f.id));
    setMentions(prev => prev.filter(x => x.id !== f.id));
    if (selected?.id === f.id) setSelected(null);
    toast({ title: "Deleted", description: "Finding removed permanently." });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div className="max-w-3xl">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Your Identity. <span className="text-primary">Everywhere.</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              We scan the web, social media, casting platforms, ad networks, and deepfake databases for unauthorized use of your face, voice, and name.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPro ? (
              <Badge className="bg-primary/15 text-primary border border-primary/40">Pro Shield Active</Badge>
            ) : (
              <Badge variant="outline">Free</Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setTourOpen(true)}
              className="gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> Take the tour
            </Button>
          </div>
        </div>

        {/* Takedown Credits */}
        <TakedownCreditsCard isPro={isPro} />

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((s) => (
            <Card key={s.label} className="glass-card border-border/30">
              <CardContent className="p-5">
                <s.icon className="w-5 h-5 text-primary mb-3" />
                <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Scan Coverage */}
        <div ref={coverageRef} className="relative mb-6">
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="font-display text-lg">Scan Coverage</CardTitle>
              <p className="text-sm text-muted-foreground">Exactly where we look for you, every day.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Social & Video Platforms
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {SOCIAL_PLATFORMS.map((p) => (
                    <PlatformTile key={p.name} name={p.name} Icon={p.icon} locked={!isPro} />
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Web & Commercial Use
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {WEB_PLATFORMS.map((p) => (
                    <PlatformTile key={p.name} name={p.name} Icon={p.icon} locked={!isPro} />
                  ))}
                </div>
              </section>
              <section>
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
                  Deepfake & AI Detection
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AI_PLATFORMS.map((p) => (
                    <PlatformTile key={p.name} name={p.name} Icon={p.icon} locked={!isPro} />
                  ))}
                </div>
              </section>
            </CardContent>
          </Card>

          {!isPro && (
            <div className="absolute inset-0 backdrop-blur-[3px] bg-background/60 rounded-lg flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="font-display text-lg font-bold text-foreground mb-2">
                  Pro Shield monitors 20+ platforms 24/7
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  for your face, voice, and name. Free accounts show a preview only.
                </p>
                <Link to="/#pricing">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Unlock Full Monitoring — Upgrade to Pro Shield <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Impersonator Detection */}
        <ImpersonatorDetection performerName={performerName} registryId={registryId} />

        {/* Run My Scan */}
        <div className="mb-6">
          <Button
            onClick={runScan}
            className={`w-full md:w-auto text-base font-semibold gap-2 ${
              scanning
                ? "bg-muted text-muted-foreground hover:bg-muted/80"
                : "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            }`}
            size="lg"
          >
            {scanning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" /> Stop Scan
              </>
            ) : (
              <>
                <Radar className="w-5 h-5" /> Run My Scan
              </>
            )}
          </Button>
          {scanning && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Scanning the web for you…
            </p>
          )}
          {scanDone && !scanning && (
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-2">
              <Check className="w-4 h-4" /> Scan complete — check your results below
            </p>
          )}
        </div>

        {/* Identity Footprint */}
        <Card className="glass-card border-border/30 mb-6 relative">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Identity Footprint
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Every place your name, face, or profile appears — including the things you forgot about.
            </p>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div ref={filterRef} className="mb-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {FILTER_TABS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      filter === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground hover:border-border"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Search platform or finding…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {/* Table or empty state */}
            {findings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <span className="absolute inset-5 rounded-full bg-primary flex items-center justify-center">
                    <Radar className="w-6 h-6 text-primary-foreground" />
                  </span>
                </div>
                <p className="font-display text-lg font-semibold text-foreground">
                  No results yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Hit "Run My Scan" above to scan the web for your likeness.
                </p>
              </div>
            ) : (
              <div ref={tableRef} className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>What Was Found</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((f, i) => {
                      const s = STATUS_STYLES[f.status];
                      return (
                        <TableRow
                          key={f.id}
                          ref={i === 0 ? rowRef : undefined}
                          className="cursor-pointer"
                          onClick={() => setSelected(f)}
                        >
                          <TableCell className="font-medium text-foreground whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <FindingThumbnail finding={f} size="sm" />
                              {f.platform}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-md" onClick={(e) => e.stopPropagation()}>
                            {f.url && f.url !== "#" ? (
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate block text-primary hover:underline"
                              >
                                {f.finding}
                              </a>
                            ) : (
                              <div className="truncate">{f.finding}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground whitespace-nowrap">
                            {new Date(f.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-md border whitespace-nowrap ${s.pill}`}>
                              {s.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                onClick={() => deleteFinding(f)}
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    ref={i === 0 ? actionRef : undefined}
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                  >
                                    Action <MoreHorizontal className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleAction(f, "Dismissed")}>
                                    This is fine — Dismiss
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to="/tools/dmca">File DMCA Notice</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to="/tools/contracts">Send Cease & Desist</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAction(f, "Reported to Platform")}>
                                    Report to Platform
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteFinding(f)}
                                  >
                                    Delete permanently
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No results match this filter.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {!isPro && findings.length > 0 && (
            <div className="absolute inset-0 top-[180px] backdrop-blur-md bg-background/70 rounded-b-lg flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="font-display text-lg font-bold text-foreground mb-2">
                  See every place your face appears
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Free accounts show a redacted preview. Upgrade to unlock your full identity footprint.
                </p>
                <Link to="/#pricing">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Unlock Full Monitoring <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-3">
            <Link to="/tools/dmca">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                Generate DMCA Notice
              </Button>
            </Link>
            <Link to="/tools/contracts">
              <Button variant="outline" className="w-full">Send Cease & Desist</Button>
            </Link>
            <Link to="/dashboard/violations">
              <Button variant="outline" className="w-full">Report to Platform</Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selected.platform}</DialogTitle>
                <DialogDescription>{selected.finding}</DialogDescription>
              </DialogHeader>

              {/* Thumbnail placeholder */}
              <div className="aspect-video w-full bg-secondary/40 border border-border/40 rounded-lg flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground/40" />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">URL</span>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <a
                      href={selected.url}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      {selected.url} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <button
                      onClick={() => copyUrl(selected.url)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label="Copy URL"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date first detected</span>
                  <span className="text-foreground">{new Date(selected.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date last seen</span>
                  <span className="text-foreground">{new Date(selected.lastSeen).toLocaleDateString()}</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">AI confidence</span>
                    <span className="text-foreground font-medium">
                      {selected.confidence}% match to your registered face
                    </span>
                  </div>
                  <Progress value={selected.confidence} />
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/30 p-3">
                  <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                    Recommended action
                  </div>
                  <div className="text-sm text-foreground">{selected.recommended}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to="/tools/dmca">File DMCA</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/tools/contracts">Cease & Desist</Link>
                </Button>
                <Button variant="outline" onClick={() => handleAction(selected, "Reported to Platform")}>
                  Report
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleAction(selected, "Dismissed");
                    setSelected(null);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <MonitoringTour steps={tourSteps} open={tourOpen} onClose={closeTour} />
    </DashboardLayout>
  );
};

export default Monitoring;
