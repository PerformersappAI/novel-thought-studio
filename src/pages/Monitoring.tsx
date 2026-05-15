import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ImpersonatorDetection from "@/components/monitoring/ImpersonatorDetection";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Eye, AlertTriangle, Radar, Music2, Instagram, Facebook, Youtube, Twitter,
  Linkedin, Search, Globe, Newspaper, Bot, ExternalLink,
  Copy, Check, Trash2, ThumbsUp, ThumbsDown, Gavel, FileWarning, Flag,
  ShieldCheck, RefreshCw, FileText, FolderPlus, Folder, FolderOpen, Plus, X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FILTER_TABS, STATUS_STYLES, type Finding, type FindingCategory,
} from "@/components/monitoring/findings";
import { ShieldAlert } from "lucide-react";

/* ─── Section grouping by mention_type ─── */
const IDENTITY_TYPES = new Set(["face_match", "news", "casting", "web"]);
const THREAT_TYPES = new Set([
  "deepfake", "voice_clone", "fake_profile", "social_tiktok", "social_instagram",
]);

const IDENTITY_TABS: { key: string; label: string }[] = [
  { key: "All", label: "All" },
  { key: "face_match", label: "Face Matches" },
  { key: "news", label: "News" },
  { key: "casting", label: "Casting" },
  { key: "web", label: "Web" },
];
const THREAT_TABS: { key: string; label: string }[] = [
  { key: "All", label: "All" },
  { key: "deepfake", label: "Deepfakes" },
  { key: "voice_clone", label: "Voice Clones" },
  { key: "fake_profile", label: "Fake Profiles" },
  { key: "social_tiktok", label: "TikTok" },
  { key: "social_instagram", label: "Instagram" },
];

const buildNameTokens = (names: (string | null | undefined)[]): string[] => {
  const tokens = new Set<string>();
  for (const n of names) {
    if (!n) continue;
    const lower = n.toLowerCase().trim().replace(/\s+/g, " ");
    if (lower.length < 3) continue;
    const parts = lower.split(" ").filter(Boolean);
    if (parts.length >= 2) {
      tokens.add(parts.join(" "));
      tokens.add(parts.join("-"));
      tokens.add(parts.join("_"));
      tokens.add(parts.join(""));
    } else {
      tokens.add(lower);
    }
  }
  return [...tokens];
};
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

/* ─── URL → domain / category / title helpers ─── */
function extractDomain(url?: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function extractPath(url?: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return (u.pathname + u.search).replace(/\/$/, "") || "/";
  } catch {
    return "";
  }
}
function classifyByDomain(url?: string | null, title?: string | null, snippet?: string | null): FindingCategory {
  const d = extractDomain(url).toLowerCase();
  const text = `${title || ""} ${snippet || ""}`.toLowerCase();
  if (/(deepfake|ai generated|ai-generated|cloned|clone of)/.test(text)) return "Deepfakes";
  if (/(instagram|tiktok|facebook|twitter|x\.com|linkedin|youtube|threads\.net|reddit)/.test(d)) return "Social Media";
  if (/(actorsaccess|backstage|castingnetworks|imdb|lacasting|nycasting|castingfrontier)/.test(d)) return "Casting Platforms";
  if (/(variety|deadline|hollywoodreporter|people|tmz|ew\.com|nytimes|bbc|cnn|guardian|reuters|forbes|vulture)/.test(d)) return "News & Articles";
  if (/(shutterstock|gettyimages|adobe|istockphoto|alamy|doubleclick|googlesyndication|ads)/.test(d)) return "Ads & Commercial";
  return "News & Articles";
}
function isGenericTitle(title?: string | null): boolean {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  return t === "" || t.startsWith("web result for") || t.startsWith("result for") || t === "untitled";
}
function deriveTitle(rawTitle: string | null | undefined, url: string | null | undefined): string {
  if (!isGenericTitle(rawTitle)) return rawTitle as string;
  const d = extractDomain(url);
  return d || rawTitle || "Untitled result";
}
function deriveExcerpt(rawExcerpt: string | null | undefined, url: string | null | undefined): string {
  const e = (rawExcerpt || "").trim();
  if (e) return e;
  const d = extractDomain(url);
  const p = extractPath(url);
  return d ? `${d}${p}` : "";
}
function faviconUrl(url?: string | null): string {
  const d = extractDomain(url);
  if (!d) return "";
  return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
}

/* ─── Radar SVG animation ─── */
const RadarGraphic = ({ active }: { active: boolean }) => (
  <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto">
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
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`w-4 h-4 rounded-full bg-primary shadow-[0_0_20px_4px] shadow-primary/60 ${active ? "animate-pulse" : ""}`} />
    </div>
    {active && (
      <div className="absolute inset-0 origin-center" style={{ animation: "spin 3s linear infinite" }}>
        <div className="absolute left-1/2 top-0 h-1/2 w-0.5" style={{ background: "linear-gradient(to top, hsl(var(--primary)), transparent)", transformOrigin: "bottom center" }} />
      </div>
    )}
    {active && <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse" />}
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
        <p className="text-sm text-foreground font-medium whitespace-normal break-words leading-snug">{finding.finding}</p>
        {finding.url && finding.url !== "#" && (
          <a href={finding.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary mt-0.5 inline-flex items-center gap-1 truncate max-w-full" onClick={(e) => e.stopPropagation()}>
            {finding.url.replace(/^https?:\/\//, "").substring(0, 50)}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-muted-foreground font-mono">{new Date(finding.date).toLocaleDateString()}</span>
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
  folder_id?: string | null;
}

interface MentionFolder {
  id: string;
  name: string;
  color: string;
}

const FOLDER_COLORS = ["#C41230", "#D4A843", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeStatus = (status?: string | null): Finding["status"] => {
  const value = (status || "").toLowerCase();
  if (value.includes("resolved") || value.includes("dismiss")) return "Resolved";
  if (value.includes("review") || value.includes("pending")) return "Under Review";
  if (value.includes("takedown") || value.includes("filed")) return "Takedown Filed";
  if (value.includes("info") || value.includes("legitimate")) return "Informational";
  return "New Alert";
};

const MENTION_TYPE_TO_CATEGORY: Record<string, FindingCategory> = {
  youtube: "Social Media",
  tiktok: "Social Media",
  social_tiktok: "Social Media",
  social_instagram: "Social Media",
  fake_profile: "Fake Profiles",
  casting: "Casting Platforms",
  casting_platform: "Casting Platforms",
  deepfake: "Deepfakes",
  face_match: "Deepfakes",
  ads_commercial: "Ads & Commercial",
  news: "News & Articles",
  voice_clone: "Voice Clones",
  image: "Deepfakes",
  web: "News & Articles",
};

const normalizeCategory = (mentionType?: string | null, category?: string | null): FindingCategory => {
  if (mentionType && MENTION_TYPE_TO_CATEGORY[mentionType]) {
    return MENTION_TYPE_TO_CATEGORY[mentionType];
  }
  const valid = FILTER_TABS.filter((tab) => tab !== "All") as FindingCategory[];
  return valid.includes(category as FindingCategory) ? (category as FindingCategory) : "News & Articles";
};

const MENTION_TYPE_TO_MEDIA: Record<string, Finding["mediaType"]> = {
  youtube: "video",
  tiktok: "video",
  social_tiktok: "image",
  social_instagram: "image",
  deepfake: "video",
  face_match: "image",
  image: "image",
  fake_profile: "image",
  casting: "image",
  casting_platform: "image",
  ads_commercial: "image",
  voice_clone: "audio",
  news: "article",
  web: "article",
};

const normalizeMediaType = (mediaType?: string | null, mentionType?: string | null): Finding["mediaType"] => {
  if (mediaType === "image" || mediaType === "video" || mediaType === "audio" || mediaType === "article") return mediaType;
  if (mentionType && MENTION_TYPE_TO_MEDIA[mentionType]) return MENTION_TYPE_TO_MEDIA[mentionType];
  return "article";
};

const createScanLine = (id: string, platform: string, finding: string): Finding => ({
  id,
  platform,
  finding,
  category: "News & Articles",
  date: new Date().toISOString(),
  lastSeen: new Date().toISOString(),
  status: "Under Review",
  url: "#",
  confidence: 100,
  recommended: "Report to Platform",
  mediaType: "article",
});

const SCAN_LINES: Finding[] = [
  createScanLine("scan-web", "Web", "Booting identity radar and checking public web indexes…"),
  createScanLine("scan-social", "Social", "Scanning social platforms for image, name, and profile matches…"),
  createScanLine("scan-ai", "AI", "Checking AI databases, synthetic media signals, and clone markers…"),
  createScanLine("scan-news", "News", "Cross-referencing articles, casting listings, and commercial usage…"),
];

const Monitoring = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [findings, setFindings] = useState<Finding[]>([]);
  const [mentions, setMentions] = useState<MentionRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTER_TABS)[number]>("All");
  const [identityFilter, setIdentityFilter] = useState<string>("All");
  const [threatFilter, setThreatFilter] = useState<string>("All");
  const [nameTokens, setNameTokens] = useState<string[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [selected, setSelected] = useState<Finding | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [liveFeed, setLiveFeed] = useState<Finding[]>([]);
  const scanAbortRef = useRef<AbortController | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Folders
  const [folders, setFolders] = useState<MentionFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null); // null = "All", or folder id
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  /* ─── Load folders ─── */
  const loadFolders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("mention_folders").select("*").eq("user_id", user.id).order("created_at");
    setFolders((data as any[]) ?? []);
  }, [user]);

  useEffect(() => { loadFolders(); }, [loadFolders]);

  /* ─── Load mentions (always fresh, no cache) ─── */
  const loadMentions = useCallback(async () => {
    if (!user) return;

    // Clear any stale state immediately so old results never linger
    setMentions([]);
    setFindings([]);

    const { data: prof } = await supabase
      .from("profiles")
      .select("stage_name, legal_name, full_name, external_actor_id")
      .eq("user_id", user.id)
      .maybeSingle();

    setNameTokens(buildNameTokens([
      (prof as any)?.stage_name,
      (prof as any)?.legal_name,
      (prof as any)?.full_name,
    ]));

    const dbRows: MentionRow[] = [];

    let externalRows: MentionRow[] = [];
    const externalActorId = (prof as any)?.external_actor_id;
    if (externalActorId) {
      try {
        const cacheBust = `&_=${Date.now()}`;
        const { data: extData } = await supabase.functions.invoke(
          "actor-registry?action=get_mentions&actor_id=" + externalActorId + cacheBust,
          { method: "GET" }
        );
        console.log("[Monitoring] Raw extData:", JSON.stringify(extData).substring(0, 3000));
        const extMentions = extData?.mentions || extData?.results || extData?.data?.mentions || extData?.data || extData || [];
        console.log("[Monitoring] extMentions count:", extMentions.length, "first 3 mention_types:", extMentions.slice?.(0, 3).map?.((m: any) => m.mention_type));
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
            folder_id: null,
          }));
        }
      } catch (err) {
        console.warn("Failed to fetch external mentions:", err);
      }
    }

    const dbUrls = new Set(dbRows.map(r => r.url).filter(Boolean));
    const merged = [...dbRows, ...externalRows.filter(r => !r.url || !dbUrls.has(r.url))];
    setMentions(merged);

    const data: Finding[] = merged.map((m) => {
      const enrichedTitle = deriveTitle(m.title, m.url);
      const enrichedExcerpt = deriveExcerpt(m.excerpt, m.url);
      const dbCategory = normalizeCategory(m.mention_type, m.category);
      const isGeneric = isGenericTitle(m.title);
      const finalCategory = isGeneric || dbCategory === "News & Articles"
        ? classifyByDomain(m.url, enrichedTitle, enrichedExcerpt)
        : dbCategory;
      return {
        id: m.id,
        platform: m.mention_type,
        finding: enrichedTitle,
        category: finalCategory,
        date: m.found_at,
        lastSeen: m.found_at,
        status: normalizeStatus(m.status),
        url: m.url || "#",
        confidence: m.confidence ?? 90,
        recommended: "Report to Platform" as const,
        mediaType: normalizeMediaType(m.media_type, m.mention_type),
        thumbnailUrl: m.thumbnail_url ?? undefined,
        audioUrl: m.audio_url ?? undefined,
        excerpt: enrichedExcerpt || undefined,
        matchLabel: m.match_label ?? undefined,
      };
    });

    setFindings(data);
  }, [user]);

  // Always re-fetch fresh on mount — never use cached results
  useEffect(() => { loadMentions(); }, [loadMentions]);

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
    setSelectedIds(new Set());
    const controller = new AbortController();
    scanAbortRef.current = controller;

    let rotatingIndex = 0;
    let feedIndex = 0;
    const feedInterval = setInterval(() => {
      if (controller.signal.aborted) return;
      setLiveFeed(prev => {
        const visibleLines = [...SCAN_LINES, ...findings];
        if (feedIndex < visibleLines.length) {
          return [...prev, { ...visibleLines[feedIndex], id: `${visibleLines[feedIndex].id}-${feedIndex}` }];
        }
        const line = SCAN_LINES[rotatingIndex % SCAN_LINES.length];
        rotatingIndex++;
        return [...prev.slice(-10), { ...line, id: `${line.id}-${Date.now()}` }];
      });
      if (feedIndex < SCAN_LINES.length + findings.length) {
        feedIndex++;
      }
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, 400);

    try {
      const scanPromise = supabase.functions.invoke("actor-registry?action=scan", { method: "POST" });
      await Promise.allSettled([scanPromise, wait(3200)]);
      if (controller.signal.aborted) { clearInterval(feedInterval); return; }
      await loadMentions();
      if (controller.signal.aborted) { clearInterval(feedInterval); return; }
      await wait(500);
      setScanDone(true);
      toast({ title: "Scan complete", description: "All results loaded." });
    } catch (err: any) {
      if (err.name === "AbortError") { clearInterval(feedInterval); return; }
      setScanDone(true);
      toast({ title: "Scan finished", description: "Showing available results." });
    } finally {
      clearInterval(feedInterval);
      setScanning(false);
      scanAbortRef.current = null;
    }
  };

  /* ─── Section partitioning ─── */
  const matchesQuery = (f: Finding) => {
    const q = searchQ.trim().toLowerCase();
    return !q || f.platform.toLowerCase().includes(q) || f.finding.toLowerCase().includes(q);
  };
  const hasNameMatch = (f: Finding) => {
    if (nameTokens.length === 0) return false;
    const hay = `${f.url || ""} ${f.finding || ""}`.toLowerCase().replace(/%20/g, " ");
    return nameTokens.some((t) => hay.includes(t));
  };

  const identityFindings = useMemo(() => {
    return findings.filter((f) => {
      const t = (f.platform || "").toLowerCase();
      if (!IDENTITY_TYPES.has(t)) return false;
      if (!hasNameMatch(f)) return false;
      if (identityFilter !== "All" && t !== identityFilter) return false;
      return matchesQuery(f);
    });
  }, [findings, identityFilter, searchQ, nameTokens]);

  const threatFindings = useMemo(() => {
    return findings.filter((f) => {
      const t = (f.platform || "").toLowerCase();
      if (!THREAT_TYPES.has(t)) return false;
      if (threatFilter !== "All" && t !== threatFilter) return false;
      return matchesQuery(f);
    });
  }, [findings, threatFilter, searchQ]);

  // Legacy `filtered` kept for any remaining references (folders/bulk panel).
  const filtered = useMemo(() => [...identityFindings, ...threatFindings], [identityFindings, threatFindings]);

  /* ─── Selection helpers ─── */
  const allSelected = filtered.length > 0 && filtered.every(f => selectedIds.has(f.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(f => f.id)));
    }
  };

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
    setSelectedIds(prev => { const n = new Set(prev); n.delete(f.id); return n; });
    if (selected?.id === f.id) setSelected(null);
    toast({ title: "Deleted" });
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("mentions").delete().in("id", ids);
    if (error) { toast({ title: "Failed to delete some items", variant: "destructive" }); return; }
    setFindings(prev => prev.filter(x => !selectedIds.has(x.id)));
    setMentions(prev => prev.filter(x => !selectedIds.has(x.id)));
    setSelectedIds(new Set());
    toast({ title: `Deleted ${ids.length} item${ids.length > 1 ? "s" : ""}` });
  };

  const bulkMoveToFolder = async (folderId: string) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const { error } = await supabase.from("mentions").update({ folder_id: folderId } as any).in("id", ids);
    if (error) { toast({ title: "Failed to move items", variant: "destructive" }); return; }
    setMentions(prev => prev.map(m => ids.includes(m.id) ? { ...m, folder_id: folderId } : m));
    setSelectedIds(new Set());
    const folder = folders.find(f => f.id === folderId);
    toast({ title: `Moved ${ids.length} item${ids.length > 1 ? "s" : ""} to "${folder?.name}"` });
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const { data, error } = await supabase.from("mention_folders").insert({
      user_id: user.id,
      name: newFolderName.trim(),
      color: newFolderColor,
    } as any).select().single();
    if (error || !data) { toast({ title: "Failed to create folder", variant: "destructive" }); return; }
    setFolders(prev => [...prev, data as any]);
    setNewFolderName("");
    setShowNewFolder(false);
    toast({ title: `Folder "${(data as any).name}" created` });
  };

  const deleteFolder = async (folderId: string) => {
    await supabase.from("mentions").update({ folder_id: null } as any).eq("folder_id", folderId);
    await supabase.from("mention_folders").delete().eq("id", folderId);
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setMentions(prev => prev.map(m => m.folder_id === folderId ? { ...m, folder_id: null } : m));
    if (activeFolder === folderId) setActiveFolder(null);
    toast({ title: "Folder deleted, items moved back to All" });
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-2">
            The <span className="text-primary">Scanner</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            What we found across the web and social media for your mapped identity — face, voice, videos, names.
          </p>
        </motion.div>

        {/* ─── RADAR + SCAN BUTTON ─── */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm p-8 mb-8">
          <RadarGraphic active={scanning} />
          <div className="text-center mt-6 space-y-4">
            {scanning ? (
              <>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-mono text-primary tracking-wider uppercase">Scanning {liveFeed.length} sources…</span>
                </div>
                <Button onClick={runScan} variant="outline" size="lg" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Stop Scan
                </Button>
              </>
            ) : scanDone ? (
              <>
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-semibold">Scan complete — {findings.length} results found</span>
                </div>
                <Button onClick={runScan} size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
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
                <Button onClick={runScan} size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base px-8">
                  <Radar className="w-5 h-5" /> Run My Scan
                </Button>
              </>
            )}
          </div>
        </motion.div>

        {/* ─── LIVE TERMINAL FEED (during scan) ─── */}
        <AnimatePresence>
          {scanning && liveFeed.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8">
              <div className="rounded-2xl border border-primary/20 bg-[hsl(var(--background))]/80 backdrop-blur-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-mono text-primary uppercase tracking-wider">Live Feed</span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">{liveFeed.length} found</span>
                </div>
                <div ref={feedRef} className="max-h-72 overflow-y-auto p-3 space-y-1.5 scroll-smooth" style={{ scrollbarWidth: "thin" }}>
                  {liveFeed.map((f, i) => (
                    <TerminalLine key={f.id + "-feed-" + i} finding={f} index={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── FOLDERS SIDEBAR + RESULTS ─── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-sm mb-8">
          {/* Header row */}
          <div className="px-5 py-4 border-b border-border/20 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Web &amp; Social Matches</h2>
              <Badge variant="outline" className="ml-2 text-xs">{findings.length}</Badge>
            </div>
            <div className="flex-1" />
            <Input placeholder="Search…" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} className="max-w-xs bg-background/40 border-border/30" />
          </div>

          {/* Folders bar */}
          <div className="px-5 py-3 border-b border-border/10 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveFolder(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                activeFolder === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/30 hover:text-foreground hover:border-border"
              }`}
            >
              <FolderOpen className="w-3 h-3" /> All
            </button>
            <button
              onClick={() => setActiveFolder("__unfiled__")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                activeFolder === "__unfiled__"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 text-muted-foreground border-border/30 hover:text-foreground hover:border-border"
              }`}
            >
              <Folder className="w-3 h-3" /> Unfiled
            </button>
            {folders.map((folder) => (
              <div key={folder.id} className="relative group">
                <button
                  onClick={() => setActiveFolder(folder.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                    activeFolder === folder.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/30 text-muted-foreground border-border/30 hover:text-foreground hover:border-border"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                  {folder.name}
                  <span className="text-[10px] opacity-60">
                    ({mentions.filter(m => m.folder_id === folder.id).length})
                  </span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete folder"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            {showNewFolder ? (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Folder name…"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createFolder()}
                  className="h-8 w-32 text-xs bg-background/40 border-border/30"
                  autoFocus
                />
                <div className="flex gap-1">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewFolderColor(c)}
                      className={`w-4 h-4 rounded-full border-2 transition-transform ${newFolderColor === c ? "border-foreground scale-125" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={createFolder}>
                  <Check className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewFolder(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border/40 text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3 h-3" /> New Folder
              </button>
            )}
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

          {/* Bulk actions bar */}
          <AnimatePresence>
            {someSelected && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-5 py-3 border-b border-primary/20 bg-primary/5 flex items-center gap-3 flex-wrap"
              >
                <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
                <Button size="sm" variant="destructive" className="h-7 gap-1.5 text-xs" onClick={bulkDelete}>
                  <Trash2 className="w-3 h-3" /> Delete Selected
                </Button>
                {folders.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10">
                        <FolderPlus className="w-3 h-3" /> Move to Folder
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {folders.map((folder) => (
                        <DropdownMenuItem key={folder.id} onClick={() => bulkMoveToFolder(folder.id)} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: folder.color }} />
                          {folder.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="divide-y divide-border/10">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Radar className="w-10 h-10 text-primary/30 mx-auto mb-3" />
                <p className="font-display text-lg font-semibold text-foreground">
                  {findings.length === 0 ? "Scanner is active. No matches yet." : "No results match this filter"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {findings.length === 0 ? 'Run the scanner to sweep the web and social media for your mapped identity.' : "Try a different filter or search term."}
                </p>
              </div>
            ) : (
              <>
                {/* Select all row */}
                <div className="flex items-center gap-3 px-5 py-2.5 bg-secondary/10 border-b border-border/10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    className="border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-xs text-muted-foreground font-medium">
                    {allSelected ? "Deselect all" : `Select all ${filtered.length} results`}
                  </span>
                </div>

                {filtered.map((f) => {
                  const PIcon = getPlatformIcon(f.platform);
                  const s = STATUS_STYLES[f.status] ?? STATUS_STYLES["New Alert"];
                  const isChecked = selectedIds.has(f.id);
                  const mention = mentions.find(m => m.id === f.id);
                  const folder = mention?.folder_id ? folders.find(fo => fo.id === mention.folder_id) : null;

                  return (
                    <div
                      key={f.id}
                      className={`flex items-start gap-3 px-5 py-4 hover:bg-primary/5 transition-colors group cursor-pointer ${isChecked ? "bg-primary/[0.03]" : ""}`}
                      onClick={() => setSelected(f)}
                    >
                      {/* Checkbox */}
                      <div className="shrink-0 mt-1" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelect(f.id)}
                          className="border-muted-foreground/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>

                      {/* Platform icon (favicon when available) */}
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                        {f.url && f.url !== "#" && faviconUrl(f.url) ? (
                          <img
                            src={faviconUrl(f.url)}
                            alt=""
                            className="w-5 h-5 rounded-sm"
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.display = "none";
                              const sib = img.nextElementSibling as HTMLElement | null;
                              if (sib) sib.style.display = "block";
                            }}
                          />
                        ) : null}
                        <PIcon className="w-4 h-4 text-primary" style={{ display: f.url && f.url !== "#" && faviconUrl(f.url) ? "none" : "block" }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground whitespace-normal break-words leading-snug">{f.finding}</p>
                            {f.excerpt && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">{f.excerpt}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/30 text-primary/80 bg-primary/5 uppercase tracking-wider">
                                {f.category}
                              </span>
                              <span className="text-xs text-muted-foreground">{extractDomain(f.url) || f.platform}</span>
                              <span className="text-[10px] text-muted-foreground/50">•</span>
                              <span className="text-xs text-muted-foreground font-mono">{new Date(f.date).toLocaleDateString()}</span>
                              {folder && (
                                <>
                                  <span className="text-[10px] text-muted-foreground/50">•</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1" style={{ borderColor: folder.color + "40", color: folder.color }}>
                                    <Folder className="w-2.5 h-2.5" /> {folder.name}
                                  </span>
                                </>
                              )}
                              {f.url && f.url !== "#" && (
                                <>
                                  <span className="text-[10px] text-muted-foreground/50">•</span>
                                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/70 hover:text-primary inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                    Source <ExternalLink className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${s.pill}`}>{s.label}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-emerald-500 hover:bg-emerald-500/10" onClick={() => handleDismiss(f)} title="That's me — dismiss">
                          <ThumbsUp className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10" title="Not me — take action">
                              <ThumbsDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to="/tools/dmca" className="flex items-center gap-2"><Gavel className="w-4 h-4" /> File DMCA Notice</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/tools/contracts" className="flex items-center gap-2"><FileWarning className="w-4 h-4" /> Cease & Desist</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/dashboard/violations" className="flex items-center gap-2"><Flag className="w-4 h-4" /> Report to Platform</Link>
                            </DropdownMenuItem>
                            {folders.length > 0 && (
                              <>
                                <DropdownMenuSeparator />
                                {folders.map((folder) => (
                                  <DropdownMenuItem key={folder.id} onClick={() => bulkMoveToFolder(folder.id)} className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: folder.color }} />
                                    Move to {folder.name}
                                  </DropdownMenuItem>
                                ))}
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive flex items-center gap-2" onClick={() => deleteFinding(f)}>
                              <Trash2 className="w-4 h-4" /> Delete permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary hover:bg-primary/10" onClick={() => setSelected(f)} title="View details">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </motion.div>

        {/* ─── SOCIAL IMPERSONATION DETECTION ─── */}
        <ImpersonatorDetection />

        {/* ─── QUICK ACTIONS ─── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid sm:grid-cols-3 gap-3 mb-8">
          <Link to="/tools/dmca">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"><Gavel className="w-4 h-4" /> Generate DMCA Notice</Button>
          </Link>
          <Link to="/tools/contracts">
            <Button variant="outline" className="w-full gap-2"><FileWarning className="w-4 h-4" /> Cease & Desist</Button>
          </Link>
          <Link to="/dashboard/violations">
            <Button variant="outline" className="w-full gap-2"><Flag className="w-4 h-4" /> Report Violation</Button>
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

              {/* Screenshot preview */}
              {selected.url && selected.url !== "#" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Page Preview</p>
                  <a href={selected.url} target="_blank" rel="noopener noreferrer" className="block w-full rounded-lg overflow-hidden border border-border/40 bg-secondary/20 hover:border-primary/40 transition-colors relative group">
                    <div className="aspect-video w-full bg-secondary/30 relative">
                      <img
                        src={selected.thumbnailUrl || `https://image.thum.io/get/width/600/crop/400/${selected.url}`}
                        alt={`Preview of ${selected.finding}`}
                        className="w-full h-full object-cover object-top"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const fallback = target.parentElement?.querySelector(".preview-fallback") as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div className="preview-fallback absolute inset-0 items-center justify-center bg-secondary/40 hidden">
                        {(() => { const PIcon = getPlatformIcon(selected.platform); return <PIcon className="w-10 h-10 text-muted-foreground/40" />; })()}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                          <ExternalLink className="w-3 h-3" /> Open page
                        </span>
                      </div>
                    </div>
                  </a>
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
