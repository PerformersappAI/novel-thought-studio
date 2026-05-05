import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye, AlertTriangle, Radar, Music2, Instagram, Facebook, Youtube, Twitter,
  Linkedin, Search, Globe, Newspaper, Bot, MoreHorizontal, ExternalLink,
  Copy, Check, Trash2, ThumbsUp, ThumbsDown, Gavel, FileWarning, Flag,
  ShieldCheck, RefreshCw, FileText, Mic,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FILTER_TABS, STATUS_STYLES, type Finding, type FindingCategory,
} from "@/components/monitoring/findings";
import { useToast } from "@/hooks/use-toast";

/* ─── Platform icon map ─── */
const PLATFORM_ICONS: Record<string, any> = {
  "Web": Globe, "Instagram": Instagram, "YouTube": Youtube, "Facebook": Facebook,
  "X / Twitter": Twitter, "Twitter": Twitter, "TikTok": Music2, "LinkedIn": Linkedin,
  "Google": Search, "News": Newspaper, "news": Newspaper, "AI": Bot, "Reddit": Globe,
};
function getPlatformIcon(type: string) {
  for (const [key, Icon] of Object.entries(PLATFORM_ICONS)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return Globe;
}

/* ─── Radar SVG animation ─── */
const RadarGraphic = ({ active }: { active: boolean }) => (
  <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
    {/* Rings */}
    {[1, 2, 3].map((r) => (
      <div
        key={r}
        className="absolute inset-0 rounded-full border border-primary/20"
        style={{
          margin: `${r * 28}px`,
          animation: active ? `pulse 2s ease-out ${r * 0.3}s infinite` : undefined,
        }}
      />
    ))}
    {/* Center dot */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_4px] shadow-primary/60 ${active ? "animate-pulse" : ""}`} />
    </div>
    {/* Sweep line */}
    {active && (
      <div
        className="absolute inset-0 origin-center"
        style={{ animation: "spin 3s linear infinite" }}
      >
        <div
          className="absolute left-1/2 top-0 h-1/2 w-0.5"
          style={{
            background: "linear-gradient(to top, hsl(var(--primary)), transparent)",
            transformOrigin: "bottom center",
          }}
        />
      </div>
    )}
    {/* Glow */}
    {active && (
      <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />
    )}
  </div>
);

/* ─── Terminal feed line ─── */
const TerminalLine = ({ finding, index }: { finding: Finding; index: number }) => {
  const PIcon = getPlatformIcon(finding.platform);
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="flex items-start gap-3 py-2.5 px-3 rounded-lg bg-background/40 border border-border/20 hover:border-primary/30 transition-colors group"
    >
      <PIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground font-medium whitespace-normal break-words leading-snug">
          {finding.finding}
        </p>
        {finding.url && finding.url !== "#" && (
          <a
            href={finding.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary/70 hover:text-primary mt-0.5 inline-flex items-center gap-1 truncate max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {finding.url.replace(/^https?:\/\//, "").substring(0, 50)}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-muted-foreground font-mono">
          {new Date(finding.date).toLocaleDateString()}
        </span>
        <span className={`w-2 h-2 rounded-full ${finding.status === "New Alert" ? "bg-primary shadow-[0_0_6px] shadow-primary/60" : "bg-emerald-500"}`} />
      </div>
    </motion.div>
  );
};

/* ─── Types ─── */
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
  const { toast } = useToast();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [mentions, setMentions] = useState<MentionRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTER_TABS)[number]>("All");
  const [searchQ, setSearchQ] = useState("");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [liveFeed, setLiveFeed] = useState<Finding[]>([]);
  const scanAbortRef = useRef<AbortController | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  /* ─── Load mentions ─── */
  const loadMentions = useCallback(async () => {
    if (!user) return;

    const [{ data: mentionsData }, { data: prof }] = await Promise.all([
      supabase.from("mentions").select("*").eq("user_id", user.id).order("found_at", { ascending: false }),
      supabase.from("profiles").select("stage_name, legal_name, full_name, external_actor_id").eq("user_id", user.id).maybeSingle(),
    ]);

    const dbRows: MentionRow[] = (mentionsData ?? []) as MentionRow[];

    // Fetch external mentions
    let externalRows: MentionRow[] = [];
    const externalActorId = (prof as any)?.external_actor_id;
    if (externalActorId) {
      try {
        const { data: extData } = await supabase.functions.invoke(
          "actor-registry?action=get_mentions&actor_id=" + externalActorId,
          { method: "GET" }
        );
        const extMentions = extData?.mentions || extData || [];
        if (Array.isArray(extMentions)) {
          externalRows = extMentions.map((m: any, i: number) => ({
            id: m.id || `ext-${i}`,
            mention_type: m.mention_type || m.platform || "Web",
            title: m.title || m.finding || "",
            url: m.url || null,
            found_at: m.found_at || m.date || new Date().toISOString(),
            status: m.status || "New Alert",
            confidence: m.confidence ?? 90,
            category: m.category || null,
            media_type: m.media_type || null,
            thumbnail_url: m.thumbnail_url || null,
            audio_url: m.audio_url || null,
            excerpt: m.excerpt || null,
            match_label: m.match_label || null,
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch external mentions:", err);
      }
    }

    const dbUrls = new Set(dbRows.map(r => r.url).filter(Boolean));
    const merged = [...dbRows, ...externalRows.filter(r => !r.url || !dbUrls.has(r.url))];
    setMentions(merged);

    const data: Finding[] = merged.map((m) => ({
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

    setFindings(data);
  }, [user]);

  // Don't auto-load mentions on mount — only load after user clicks scan

  /* ─── Run scan ─── */
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
    setLiveFeed([]);
    const controller = new AbortController();
    scanAbortRef.current = controller;

    // Simulate live feed with existing findings while scan runs
    const existingFindings = [...findings];
    let feedIndex = 0;
    const feedInterval = setInterval(() => {
      if (feedIndex < existingFindings.length && !controller.signal.aborted) {
        setLiveFeed(prev => [...prev, existingFindings[feedIndex]]);
        feedIndex++;
        // Auto-scroll
        if (feedRef.current) {
          feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
      }
    }, 400);

    try {
      await supabase.functions.invoke("actor-registry?action=scan", { method: "POST" });
      if (controller.signal.aborted) { clearInterval(feedInterval); return; }
      setScanDone(true);
      toast({ title: "Scan complete", description: "All results loaded." });
      await loadMentions();
    } catch (err: any) {
      if (err.name === "AbortError") { clearInterval(feedInterval); return; }
      // Even on failure, show existing results
      setScanDone(true);
      toast({ title: "Scan finished", description: "Showing available results." });
    } finally {
      clearInterval(feedInterval);
      setScanning(false);
      scanAbortRef.current = null;
    }
  };

  /* ─── Filtered findings ─── */
  const filtered = useMemo(() => {
    return findings.filter((f) => {
      const matchesCat = filter === "All" || f.category === filter;
      const q = searchQ.trim().toLowerCase();
      const matchesSearch = !q || f.platform.toLowerCase().includes(q) || f.finding.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [findings, filter, searchQ]);

  /* ─── Actions ─── */
  const handleDismiss = async (f: Finding) => {
    await supabase.from("mentions").update({ status: "Resolved" } as any).eq("id", f.id);
    setFindings(prev => prev.map(x => x.id === f.id ? { ...x, status: "Resolved" as const } : x));
    toast({ title: "Dismissed — That's you, no action needed." });
  };

  const deleteFinding = async (f: Finding) => {
    const { error } = await supabase.from("mentions").delete().eq("id", f.id);
    if (error) { toast({ title: "Failed to delete", variant: "destructive" }); return; }
    setFindings(prev => prev.filter(x => x.id !== f.id));
    setMentions(prev => prev.filter(x => x.id !== f.id));
    if (selected?.id === f.id) setSelected(null);
    toast({ title: "Deleted" });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const alertCount = findings.filter(f => f.status === "New Alert").length;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* ─── HERO HEADER ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-2">
            Identity <span className="text-primary">Intelligence</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Real-time scanning across social media, search engines, AI databases, and the dark web for unauthorized use of your likeness.
          </p>
        </motion.div>

        {/* ─── RADAR + SCAN BUTTON ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-8 mb-8"
        >
          <RadarGraphic active={scanning} />

          <div className="text-center mt-6 space-y-4">
            {scanning ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-mono text-primary tracking-wider uppercase">
                    Scanning {liveFeed.length} sources…
                  </span>
                </div>
                <Button
                  onClick={runScan}
                  variant="outline"
                  size="lg"
                  className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <RefreshCw className="w-4 h-4 animate-spin" /> Stop Scan
                </Button>
              </>
            ) : scanDone ? (
              <>
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-semibold">Scan complete — {findings.length} results found</span>
                </div>
                <Button
                  onClick={runScan}
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  <Radar className="w-5 h-5" /> Run Again
                </Button>
              </>
            ) : (
              <>
                {alertCount > 0 && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">{alertCount} alert{alertCount > 1 ? "s" : ""} need your attention</span>
                  </div>
                )}
                <Button
                  onClick={runScan}
                  size="lg"
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base px-8"
                >
                  <Radar className="w-5 h-5" /> Run My Scan
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* ─── LIVE TERMINAL FEED (during scan) ─── */}
        <AnimatePresence>
          {scanning && liveFeed.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <div className="rounded-2xl border border-primary/20 bg-[hsl(var(--background))]/80 backdrop-blur-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-mono text-primary uppercase tracking-wider">Live Feed</span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">{liveFeed.length} found</span>
                </div>
                <div
                  ref={feedRef}
                  className="max-h-72 overflow-y-auto p-3 space-y-1.5 scroll-smooth"
                  style={{ scrollbarWidth: "thin" }}
                >
                  {liveFeed.map((f, i) => (
                    <TerminalLine key={f.id + "-feed-" + i} finding={f} index={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── RESULTS TABLE ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm mb-8"
        >
          <div className="px-5 py-4 border-b border-border/20 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Identity Footprint</h2>
              <Badge variant="outline" className="ml-2 text-xs">{findings.length}</Badge>
            </div>
            <div className="flex-1" />
            <Input
              placeholder="Search…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="max-w-xs bg-background/40 border-border/30"
            />
          </div>

          {/* Filter tabs */}
          <div className="px-5 py-3 border-b border-border/10 flex flex-wrap gap-2">
            {FILTER_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filter === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/30 text-muted-foreground border-border/30 hover:text-foreground hover:border-border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="divide-y divide-border/10">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Radar className="w-10 h-10 text-primary/30 mx-auto mb-3" />
                <p className="font-display text-lg font-semibold text-foreground">
                  {findings.length === 0 ? "No results yet" : "No results match this filter"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {findings.length === 0 ? 'Hit "Run My Scan" to scan the web for your likeness.' : "Try a different filter or search term."}
                </p>
              </div>
            ) : (
              filtered.map((f) => {
                const PIcon = getPlatformIcon(f.platform);
                const s = STATUS_STYLES[f.status];
                return (
                  <div
                    key={f.id}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-primary/5 transition-colors group cursor-pointer"
                    onClick={() => setSelected(f)}
                  >
                    {/* Platform icon */}
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <PIcon className="w-4 h-4 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground whitespace-normal break-words leading-snug">
                            {f.finding}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">{f.platform}</span>
                            <span className="text-[10px] text-muted-foreground/50">•</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {new Date(f.date).toLocaleDateString()}
                            </span>
                            {f.url && f.url !== "#" && (
                              <>
                                <span className="text-[10px] text-muted-foreground/50">•</span>
                                <a
                                  href={f.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary/70 hover:text-primary inline-flex items-center gap-0.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Source <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${s.pill}`}>
                          {s.label}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10"
                        onClick={() => handleDismiss(f)}
                        title="That's me — dismiss"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="Not me — take action"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to="/tools/dmca" className="flex items-center gap-2">
                              <Gavel className="w-4 h-4" /> File DMCA Notice
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/tools/contracts" className="flex items-center gap-2">
                              <FileWarning className="w-4 h-4" /> Cease & Desist
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/dashboard/violations" className="flex items-center gap-2">
                              <Flag className="w-4 h-4" /> Report to Platform
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive flex items-center gap-2"
                            onClick={() => deleteFinding(f)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                        onClick={() => setSelected(f)}
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ─── QUICK ACTIONS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid sm:grid-cols-3 gap-3 mb-8"
        >
          <Link to="/tools/dmca">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Gavel className="w-4 h-4" /> Generate DMCA Notice
            </Button>
          </Link>
          <Link to="/tools/contracts">
            <Button variant="outline" className="w-full gap-2">
              <FileWarning className="w-4 h-4" /> Cease & Desist
            </Button>
          </Link>
          <Link to="/dashboard/violations">
            <Button variant="outline" className="w-full gap-2">
              <Flag className="w-4 h-4" /> Report Violation
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* ─── DETAIL DIALOG ─── */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{selected.platform}</DialogTitle>
                <DialogDescription className="whitespace-normal break-words">{selected.finding}</DialogDescription>
              </DialogHeader>

              {selected.thumbnailUrl ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-border/40">
                  <img src={selected.thumbnailUrl} alt={selected.finding} className="w-full h-full object-cover" />
                </div>
              ) : selected.url && selected.url !== "#" && /\.(jpg|jpeg|png|gif|webp|svg)/i.test(selected.url) ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-border/40">
                  <img src={selected.url} alt={selected.finding} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              ) : (
                <div className="aspect-video w-full bg-secondary/30 border border-border/40 rounded-lg flex items-center justify-center">
                  <FileText className="w-10 h-10 text-muted-foreground/30" />
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">URL</span>
                  <div className="flex items-center gap-2 max-w-[60%]">
                    <a href={selected.url} target="_blank" rel="noreferrer" className="truncate text-foreground hover:text-primary inline-flex items-center gap-1">
                      {selected.url} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <button onClick={() => copyUrl(selected.url)} className="text-muted-foreground hover:text-foreground" aria-label="Copy URL">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date detected</span>
                  <span className="text-foreground">{new Date(selected.date).toLocaleDateString()}</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">AI confidence</span>
                    <span className="text-foreground font-medium">{selected.confidence}%</span>
                  </div>
                  <Progress value={selected.confidence} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { handleDismiss(selected); setSelected(null); }}>
                  <ThumbsUp className="w-4 h-4" /> That's Me
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1">
                  <Link to="/tools/dmca"><Gavel className="w-4 h-4" /> File DMCA</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/tools/contracts"><FileWarning className="w-4 h-4 mr-1" /> Cease & Desist</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard/violations"><Flag className="w-4 h-4 mr-1" /> Report</Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Monitoring;
