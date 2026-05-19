import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, AlertTriangle, CheckCircle2, ScanSearch, Trash2, ExternalLink, Globe, Instagram, Youtube, Facebook, Twitter, Music2, Linkedin, Search, Newspaper, Bot, Eye, MoreHorizontal, ThumbsUp, ThumbsDown, Gavel, FileWarning, Flag } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectionScoreCard from "@/components/dashboard/ProtectionScoreCard";
import DetectionPanels from "@/components/dashboard/DetectionPanels";
import ScanStatusCards from "@/components/dashboard/ScanStatusCards";
import RiskScoreCard from "@/components/dashboard/RiskScoreCard";
import FacePanel from "@/components/dashboard/FacePanel";
import VaultCompletionScore from "@/components/dashboard/VaultCompletionScore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/* ─── Platform icon map ─── */
const PLATFORM_ICONS: Record<string, any> = {
  "Web": Globe, "Instagram": Instagram, "YouTube": Youtube, "Facebook": Facebook,
  "X / Twitter": Twitter, "Twitter": Twitter, "TikTok": Music2, "LinkedIn": Linkedin,
  "Google": Search, "News": Newspaper, "AI": Bot, "Reddit": Globe,
};
function getPlatformIcon(type: string) {
  for (const [key, Icon] of Object.entries(PLATFORM_ICONS)) {
    if (type.toLowerCase().includes(key.toLowerCase())) return Icon;
  }
  return Globe;
}

function normalizeMentionType(raw: string | undefined): string {
  const map: Record<string, string> = {
    image: "Photo Match",
    image_yandex: "Photo Match",
    web: "Web Mention",
    youtube: "YouTube",
    deepfake: "Deepfake Alert",
    voice_clone: "Voice Clone",
    fake_profile: "Fake Profile",
    social_tiktok: "TikTok",
    social_instagram: "Instagram",
  };
  return map[(raw || "").trim().toLowerCase()] || (raw || "");
}

/* ─── Status badge styling ─── */
function statusBadge(status: string) {
  switch (status) {
    case "New Alert": return "bg-destructive/15 text-destructive border-destructive/30";
    case "Under Review": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    case "Resolved": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "Dismissed": return "bg-muted/40 text-muted-foreground border-border/40";
    default: return "bg-secondary/40 text-muted-foreground border-border/40";
  }
}

interface MentionRow {
  id: string;
  mention_type: string;
  title: string;
  url: string | null;
  found_at: string;
  status: string;
  thumbnail_url: string | null;
}

const PerformerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [registryId, setRegistryId] = useState<string | null>(null);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [externalRiskScore, setExternalRiskScore] = useState<number | null>(null);
  const [mentions, setMentions] = useState<MentionRow[]>([]);
  const [viewMention, setViewMention] = useState<MentionRow | null>(null);
  const [hasRunScan, setHasRunScan] = useState(false);
  const [hasUsedContractScanner, setHasUsedContractScanner] = useState(false);
  const [hasGeneratedEvidence, setHasGeneratedEvidence] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [
        { data: prof },
        { data: ver },
        { data: certs },
        { data: sub },
        { data: assets },
        { data: mentionsData },
        { data: scansData },
        { data: contractsData },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("identity_verifications").select("status").eq("user_id", user.id).maybeSingle(),
        supabase.from("certificates").select("id, registry_id").eq("user_id", user.id).limit(1),
        supabase.from("user_subscriptions").select("status").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("registry_assets").select("registry_id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1),
        supabase.from("mentions").select("id, mention_type, title, url, found_at, status, thumbnail_url").eq("user_id", user.id).order("found_at", { ascending: false }),
        supabase.from("likeness_scans").select("id").eq("user_id", user.id).limit(1),
        supabase.from("contracts").select("id").eq("user_id", user.id).limit(1),
      ]);

      setProfile(prof);
      setHasCertificate((certs && certs.length > 0) || localStorage.getItem("cmf_cert_downloaded") === "1");
      setMonitoringActive(!!sub || localStorage.getItem("cmf_monitoring_basic") === "1");
      setRegistryId(certs?.[0]?.registry_id ?? assets?.[0]?.registry_id ?? null);
      setHasRunScan(!!(scansData && scansData.length > 0));
      setHasUsedContractScanner(!!(contractsData && contractsData.length > 0));
      setHasGeneratedEvidence(localStorage.getItem("cmf_evidence_generated") === "1");
      setRegistryId(certs?.[0]?.registry_id ?? assets?.[0]?.registry_id ?? null);
      const dbRows = (mentionsData ?? []) as MentionRow[];

      // Fetch external mentions if external_actor_id exists
      let externalRows: MentionRow[] = [];
      const externalActorId = (prof as any)?.external_actor_id;
      if (externalActorId) {
        try {
          const response = await fetch(`http://187.77.199.100:8001/mentions/${externalActorId}`);
          const extData = await response.json();
          const extMentions = extData?.mentions || [];
          if (Array.isArray(extMentions)) {
            externalRows = extMentions.map((m: any, i: number) => ({
              id: m.id || `ext-${i}`,
              mention_type: normalizeMentionType(m.mention_type) || m.platform || "Web",
              title: m.title || m.finding || "",
              url: m.url || null,
              found_at: m.found_at || m.date || new Date().toISOString(),
              status: m.status || "New Alert",
              thumbnail_url: m.thumbnail_url || null,
            }));
          }
        } catch (err) {
          console.warn("Failed to fetch external mentions:", err);
        }
      }

      // Merge: DB rows first, then external rows not already in DB
      const dbUrls = new Set(dbRows.map(r => r.url).filter(Boolean));
      const rows = [
        ...dbRows,
        ...externalRows.filter(r => !r.url || !dbUrls.has(r.url)),
      ];
      setMentions(rows);
      setAlertCount(rows.filter(m => m.status === "New Alert").length);

      const paths = [prof?.face_capture_front_url, prof?.face_capture_left_url, prof?.face_capture_right_url].filter(Boolean) as string[];
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("face-captures").createSignedUrls(paths, 60 * 10);
        setThumbs((signed ?? []).map(s => s.signedUrl).filter(Boolean) as string[]);
      }

      if ((prof as any)?.external_actor_id) {
        try {
          const { data: actorData } = await supabase.functions.invoke(
            "actor-registry?action=get_actor&actor_id=" + (prof as any).external_actor_id,
            { method: "GET" }
          );
          if (actorData?.risk_score != null) setExternalRiskScore(actorData.risk_score);
        } catch {}
      }
    })();
  }, [user]);

  const dismissMention = async (id: string) => {
    const { error } = await supabase.from("mentions").update({ status: "Dismissed" } as any).eq("id", id);
    if (error) { toast({ title: "Failed to dismiss", variant: "destructive" }); return; }
    setMentions(prev => prev.map(m => m.id === id ? { ...m, status: "Dismissed" } : m));
    toast({ title: "Mention dismissed" });
  };

  const deleteMention = async (id: string) => {
    const { error } = await supabase.from("mentions").delete().eq("id", id);
    if (error) { toast({ title: "Failed to delete", variant: "destructive" }); return; }
    setMentions(prev => prev.filter(m => m.id !== id));
    toast({ title: "Deleted" });
  };

  const profileComplete = !!(profile?.legal_name && profile?.stage_name);
  const faceCaptured = !!profile?.face_registered_at;
  const voiceRegistered = !!profile?.voice_registered_at;

  const hasHeadshot = !!profile?.headshot_url;

  const vaultItems = [
    { label: "Profile complete (legal name & stage name)", done: profileComplete, points: 20, linkTo: "/dashboard/profile", linkLabel: "Complete" },
    { label: "Headshot uploaded", done: hasHeadshot, points: 15, linkTo: "/dashboard/profile", linkLabel: "Upload" },
    { label: "Face capture photos taken", done: faceCaptured, points: 15, linkTo: "/register", linkLabel: "Capture" },
    { label: "Voice recording uploaded", done: voiceRegistered, points: 15, linkTo: "/register", linkLabel: "Record" },
    { label: "Scan run at least once", done: hasRunScan, points: 15, linkTo: "/dashboard/monitoring", linkLabel: "Scan" },
    { label: "Contract scanner used", done: hasUsedContractScanner, points: 10, linkTo: "/dashboard/contract-scanner", linkLabel: "Scan" },
    { label: "Evidence packet generated", done: hasGeneratedEvidence, points: 10, linkTo: "/dashboard/evidence-packet", linkLabel: "Generate" },
  ];

  let score = 0;
  if (profileComplete) score += 25;
  if (faceCaptured) score += 25;
  if (hasCertificate) score += 20;
  if (monitoringActive) score += 30;

  const firstName = (profile?.stage_name || profile?.legal_name || profile?.full_name || user?.email || "there").split(" ")[0].replace(/@.*/, "");

  const getNextStep = () => {
    if (!faceCaptured) return { title: "Register Your Face", description: "Capture 3 quick photos to create your timestamped claim.", cta: "Start Face Capture", to: "/register" };
    if (!profileComplete) return { title: "Complete Your Profile", description: "Add your stage name and details.", cta: "Complete Profile", to: "/register" };
    if (!hasCertificate) return { title: "Download Your Certificate", description: "Get your official Face Registration Certificate.", cta: "Get Certificate", to: "/dashboard/certificate" };
    if (!monitoringActive) return { title: "Switch On the Scanner", description: "Start watching the web for your mapped identity.", cta: "Activate", to: "/onboarding/monitoring" };
    if (alertCount > 0) return { title: "Review Matches", description: `${alertCount} potential match${alertCount > 1 ? "es" : ""} found.`, cta: "View Results", to: "/dashboard/monitoring" };
    return null;
  };

  const nextStep = getNextStep();

  const handleScanSocial = () => {
    toast({
      title: "Manual Scan",
      description: "To run a full scan, go to your VPS terminal and run: cd /root/claimmyface && python3 run_all.py",
    });
  };

  /* Check if URL likely contains an image */
  const urlHasImage = (url: string | null) => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              Hey {firstName}. {faceCaptured ? "Your identity map is live." : "Let's build your identity map."}
            </h1>
            <p className="text-muted-foreground mt-1">Your Identity Map &amp; Scanner — at a glance.</p>
          </div>
          <Button onClick={handleScanSocial} disabled={scanning} className="shrink-0">
            <ScanSearch className={`w-4 h-4 mr-2 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanner running…" : "Run Scanner Now"}
          </Button>
        </header>

        <ProtectionScoreCard score={score} />

        <ScanStatusCards actorId={(profile as any)?.external_actor_id ?? null} />

        <DetectionPanels mentions={mentions} />

        <VaultCompletionScore items={vaultItems} />

        <FacePanel thumbs={thumbs} registryId={registryId} registeredAt={profile?.face_registered_at} />

        {/* What We Found summary */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/30 bg-card/40 p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ScanSearch className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg font-semibold">Scanner Activity</h2>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard/monitoring"><ScanSearch className="w-4 h-4 mr-1" /> Run New Scan</Link>
            </Button>
          </div>
          {alertCount > 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{alertCount} potential match{alertCount > 1 ? "es" : ""} found</p>
                <p className="text-xs text-muted-foreground mt-0.5">See the table below for details.</p>
              </div>
            </div>
          ) : monitoringActive ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-medium">Scanner is active</p>
                <p className="text-xs text-muted-foreground mt-0.5">No unauthorized use detected. We're watching the web and social media for your mapped identity 24/7.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/20">
              <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Scanner not active</p>
                <p className="text-xs text-muted-foreground mt-0.5">Switch on the scanner to start watching the web for your mapped identity.</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Identity Footprint Table (real Supabase data) ─── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl border border-border/30 bg-card/40 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Web &amp; Social Matches</h2>
          </div>

          {mentions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">Scanner is watching. No matches yet for your mapped identity — we'll notify you the moment something appears.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>What Was Found</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mentions.map(m => {
                    const PlatformIcon = getPlatformIcon(m.mention_type);
                    return (
                      <HoverCard key={m.id} openDelay={300}>
                        <HoverCardTrigger asChild>
                          <TableRow className="group">
                            <TableCell className="whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <PlatformIcon className="w-4 h-4 text-primary shrink-0" />
                                <span className="font-medium text-foreground">{m.mention_type}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs md:max-w-md">
                              <div className="whitespace-normal break-words text-sm leading-snug">
                                {m.title}
                              </div>
                              {m.url && (
                                <a href={m.url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  Source <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {new Date(m.found_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${statusBadge(m.status)}`}>
                                {m.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1 justify-end flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 text-emerald-500 border-emerald-500/40 hover:bg-emerald-500/10 text-xs"
                                  onClick={() => dismissMention(m.id)}
                                  title="That's me — dismiss"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" /> That's Me
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10 text-xs"
                                    >
                                      <ThumbsDown className="w-3.5 h-3.5" /> Not Me
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
                                        <FileWarning className="w-4 h-4" /> Send Cease & Desist
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link to="/dashboard/violations" className="flex items-center gap-2">
                                        <Flag className="w-4 h-4" /> Report to Platform
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive flex items-center gap-2"
                                      onClick={() => deleteMention(m.id)}
                                    >
                                      <Trash2 className="w-4 h-4" /> Delete permanently
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-1 text-primary"
                                  onClick={() => setViewMention(m)}
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </HoverCardTrigger>
                        {(m.thumbnail_url || urlHasImage(m.url)) && (
                          <HoverCardContent side="top" className="w-72 p-2">
                            <img
                              src={m.thumbnail_url || m.url!}
                              alt={m.title}
                              className="w-full rounded-md object-cover max-h-48"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                            <p className="text-xs text-muted-foreground mt-2 truncate">{m.title}</p>
                          </HoverCardContent>
                        )}
                      </HoverCard>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* Next Step */}
        {nextStep && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-6"
          >
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Your Next Step</div>
            <h3 className="font-display text-xl font-bold mb-2">{nextStep.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{nextStep.description}</p>
            <Button asChild size="lg" className="glow-red">
              <Link to={nextStep.to}>{nextStep.cta} <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </motion.div>
        )}

        {!nextStep && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold mb-1">You're fully protected</h3>
            <p className="text-sm text-muted-foreground">Your face is registered, certified, and monitored 24/7.</p>
          </motion.div>
        )}

        <RiskScoreCard monitoringActive={monitoringActive} hasCertificate={hasCertificate} faceCaptured={faceCaptured} profileComplete={profileComplete} voiceRegistered={voiceRegistered} externalRiskScore={externalRiskScore} />
      </motion.div>

      {/* Detail modal */}
      <Dialog open={!!viewMention} onOpenChange={(o) => !o && setViewMention(null)}>
        <DialogContent className="max-w-lg">
          {viewMention && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{viewMention.mention_type}</DialogTitle>
                <DialogDescription className="whitespace-normal break-words">{viewMention.title}</DialogDescription>
              </DialogHeader>
              {(viewMention.thumbnail_url || urlHasImage(viewMention.url)) ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-border/40">
                  <img src={viewMention.thumbnail_url || viewMention.url!} alt={viewMention.title} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              ) : (
                <div className="aspect-video w-full bg-secondary/40 border border-border/40 rounded-lg flex items-center justify-center">
                  <Globe className="w-10 h-10 text-muted-foreground/40" />
                </div>
              )}
              <div className="space-y-3 text-sm">
                {viewMention.url && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Source</span>
                    <a href={viewMention.url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline inline-flex items-center gap-1 max-w-[60%]">
                      {viewMention.url} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date detected</span>
                  <span className="text-foreground">{new Date(viewMention.found_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`text-xs ${statusBadge(viewMention.status)}`}>{viewMention.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => { dismissMention(viewMention.id); setViewMention(null); }}>
                  <ThumbsUp className="w-4 h-4" /> That's Me
                </Button>
                <Button asChild className="bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-1">
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

export default PerformerDashboard;
