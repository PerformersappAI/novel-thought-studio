import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  FileDown, User, ShieldAlert, ShieldCheck, ShieldQuestion,
  Loader2, ScanSearch, AlertTriangle,
} from "lucide-react";

interface ProfileData {
  legal_name: string | null;
  stage_name: string | null;
  full_name: string | null;
  created_at: string;
  face_registered_at: string | null;
  voice_registered_at: string | null;
  external_actor_id: string | null;
  external_risk_score: number | null;
}

interface MentionRow {
  id: string;
  mention_type: string;
  title: string;
  url: string | null;
  confidence: number | null;
  similarity?: number | null;
  status: string;
  found_at: string;
}

const CATEGORY_MAP: Record<string, string> = {
  news: "News", web: "Web", image: "Image", social: "Social",
  deepfake: "Deepfake", voice_clone: "Voice Clone",
  casting_platform: "Casting", youtube: "Social", tiktok: "Social",
  fake_profile: "Fake Profile", ads_commercial: "Ads",
  "News": "News", "Web": "Web", "Image": "Image", "Social": "Social",
  "AI": "Deepfake", "Google": "Web", "Instagram": "Social",
  "YouTube": "Social", "Facebook": "Social", "TikTok": "Social",
  "X / Twitter": "Social", "Twitter": "Social",
};

function bucketType(raw: string): string {
  return CATEGORY_MAP[raw] || raw || "Other";
}

const EvidencePacketPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [registryId, setRegistryId] = useState<string | null>(null);
  const [mentions, setMentions] = useState<MentionRow[]>([]);
  const [hasCert, setHasCert] = useState(false);
  const [hasMonitoring, setHasMonitoring] = useState(false);
  const [externalRiskScore, setExternalRiskScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [
        { data: prof },
        { data: certs },
        { data: assets },
        { data: sub },
        { data: mentionsData },
      ] = await Promise.all([
        supabase.from("profiles").select("legal_name, stage_name, full_name, created_at, face_registered_at, voice_registered_at, external_actor_id, external_risk_score").eq("user_id", user.id).maybeSingle(),
        supabase.from("certificates").select("registry_id").eq("user_id", user.id).limit(1),
        supabase.from("registry_assets").select("registry_id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1),
        supabase.from("user_subscriptions").select("status").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("mentions").select("id, mention_type, title, url, confidence, status, found_at").eq("user_id", user.id).order("found_at", { ascending: false }),
      ]);

      setProfile(prof as any);
      setRegistryId(certs?.[0]?.registry_id ?? assets?.[0]?.registry_id ?? null);
      setHasCert((certs && certs.length > 0) || false);
      setHasMonitoring(!!sub || localStorage.getItem("cmf_monitoring_basic") === "1");

      // Fetch external mentions from actor-registry (the real data source)
      let externalRows: MentionRow[] = [];
      const externalActorId = (prof as any)?.external_actor_id;
      if (externalActorId) {
        try {
          const { data: extData } = await supabase.functions.invoke(
            `actor-registry?action=get_mentions&actor_id=${externalActorId}&_=${Date.now()}`,
            { method: "GET" }
          );
          const extMentions = extData?.mentions || extData?.results || extData?.data?.mentions || extData?.data || extData || [];
          if (Array.isArray(extMentions)) {
            externalRows = extMentions.map((m: any, i: number) => ({
              id: m.id || `ext-${i}`,
              mention_type: m.mention_type || m.platform || "Web",
              title: m.title || m.finding || "",
              url: m.url || null,
              confidence: m.confidence ?? null,
              similarity: m.similarity ?? null,
              status: m.status || "New Alert",
              found_at: m.found_at || m.date || new Date().toISOString(),
            }));
          }
        } catch (err) {
          console.warn("[EvidencePacket] external mentions fetch failed:", err);
        }
      }

      const dbRows = (mentionsData ?? []) as MentionRow[];
      const dbUrls = new Set(dbRows.map((r) => r.url).filter(Boolean));
      setMentions([...dbRows, ...externalRows.filter((r) => !r.url || !dbUrls.has(r.url))]);

      if ((prof as any)?.external_risk_score != null) {
        setExternalRiskScore((prof as any).external_risk_score);
      }

      setLoading(false);
    })();
  }, [user]);

  // Grouped counts by status (face_legitimate / face_review / face_threat / other)
  const STATUS_BUCKETS = [
    { key: "face_legitimate", label: "Legitimate (Face Match)" },
    { key: "face_review", label: "Needs Review" },
    { key: "face_threat", label: "Threats" },
  ];
  const grouped = mentions.reduce<Record<string, number>>((acc, m) => {
    const s = (m.status || "").toLowerCase();
    let key = "Other";
    if (s.includes("legitimate")) key = "Legitimate (Face Match)";
    else if (s.includes("review")) key = "Needs Review";
    else if (s.includes("threat")) key = "Threats";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const legitimateCount = grouped["Legitimate (Face Match)"] || 0;
  const reviewCount = grouped["Needs Review"] || 0;
  const threatCount = grouped["Threats"] || 0;

  const faceMatches = mentions.filter((m) => {
    const s = (m.status || "").toLowerCase();
    const score = (m.similarity ?? m.confidence ?? 0) as number;
    return s.includes("legitimate") && score >= 99;
  });


  let riskScore: number;
  if (externalRiskScore != null) {
    riskScore = Math.max(0, Math.min(100, externalRiskScore));
  } else {
    riskScore = 0;
    if (!hasMonitoring) riskScore += 35;
    if (!hasCert) riskScore += 20;
    if (!faceCaptured) riskScore += 25;
    if (!profileComplete) riskScore += 12;
    if (!voiceRegistered) riskScore += 8;
  }

  const riskLevel = riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW";
  const riskColor = riskLevel === "HIGH" ? "text-red-400" : riskLevel === "MEDIUM" ? "text-yellow-400" : "text-emerald-400";
  const RiskIcon = riskLevel === "HIGH" ? ShieldAlert : riskLevel === "MEDIUM" ? ShieldQuestion : ShieldCheck;

  // Vault completion
  const vaultSteps = [
    { label: "Profile Complete", done: profileComplete },
    { label: "Face Registered", done: faceCaptured },
    { label: "Voice Registered", done: voiceRegistered },
    { label: "Certificate Issued", done: hasCert },
    { label: "Monitoring Active", done: hasMonitoring },
  ];
  const vaultDone = vaultSteps.filter((s) => s.done).length;

  const actorName = profile?.legal_name || profile?.full_name || "—";
  const stageName = profile?.stage_name || "—";
  const regDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—";

  /* ─── PDF Generation ─── */
  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      let y = 20;

      const addPage = () => { doc.addPage(); y = 20; };
      const checkPage = (needed: number) => { if (y + needed > ph - 25) addPage(); };

      // Header bar
      doc.setFillColor(11, 21, 38); // #0B1526
      doc.rect(0, 0, pw, 40, "F");
      doc.setFillColor(196, 18, 48); // #C41230
      doc.rect(0, 40, pw, 2, "F");

      doc.setTextColor(212, 168, 67); // #D4A843
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("ClaimMyFace", 15, 18);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("EVIDENCE PACKET", 15, 30);

      doc.setFontSize(9);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pw - 15, 30, { align: "right" });

      y = 52;

      // Actor info
      doc.setFillColor(20, 30, 50);
      doc.roundedRect(12, y, pw - 24, 32, 3, 3, "F");
      doc.setTextColor(212, 168, 67);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("ACTOR IDENTITY", 18, y + 8);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Legal Name: ${actorName}`, 18, y + 16);
      doc.text(`Stage Name: ${stageName}`, 18, y + 22);
      doc.text(`Registry ID: ${registryId || "Not assigned"}`, pw / 2, y + 16);
      doc.text(`Registration Date: ${regDate}`, pw / 2, y + 22);
      y += 40;

      // Vault status
      doc.setFillColor(20, 30, 50);
      doc.roundedRect(12, y, pw - 24, 28, 3, 3, "F");
      doc.setTextColor(212, 168, 67);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("VAULT STATUS", 18, y + 8);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      let vx = 18;
      vaultSteps.forEach((s) => {
        doc.setTextColor(s.done ? 16 : 150, s.done ? 185 : 150, s.done ? 129 : 150);
        const label = `${s.done ? "✓" : "✗"} ${s.label}`;
        doc.text(label, vx, y + 18);
        vx += doc.getTextWidth(label) + 8;
        if (vx > pw - 30) { vx = 18; y += 7; }
      });
      doc.setTextColor(255, 255, 255);
      doc.text(`Completion: ${vaultDone}/${vaultSteps.length}`, 18, y + 24);
      y += 36;

      // Risk score
      checkPage(25);
      doc.setFillColor(20, 30, 50);
      doc.roundedRect(12, y, pw - 24, 18, 3, 3, "F");
      doc.setTextColor(212, 168, 67);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("RISK SCORE", 18, y + 8);
      const rc = riskLevel === "HIGH" ? [220, 50, 50] : riskLevel === "MEDIUM" ? [234, 179, 8] : [16, 185, 129];
      doc.setTextColor(rc[0], rc[1], rc[2]);
      doc.setFontSize(14);
      doc.text(`${riskScore} — ${riskLevel} RISK`, 18, y + 15);
      y += 26;

      // Mention counts by category
      checkPage(20 + Object.keys(grouped).length * 7);
      doc.setFillColor(20, 30, 50);
      const catKeys = Object.keys(grouped);
      const catBlockH = 14 + catKeys.length * 7;
      doc.roundedRect(12, y, pw - 24, catBlockH, 3, 3, "F");
      doc.setTextColor(212, 168, 67);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("SCAN RESULTS BY CATEGORY", 18, y + 8);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      let cy = y + 14;
      if (catKeys.length === 0) {
        doc.text("No scan results on record.", 18, cy);
      } else {
        catKeys.forEach((cat) => {
          doc.text(`${cat}: ${grouped[cat]} result${grouped[cat] > 1 ? "s" : ""}`, 18, cy);
          cy += 7;
        });
      }
      doc.text(`Total: ${mentions.length}`, pw - 15, y + 8, { align: "right" });
      y += catBlockH + 8;

      // Face matches
      checkPage(20);
      doc.setFillColor(20, 30, 50);
      const fmBlockH = 14 + Math.max(faceMatches.length, 1) * 7;
      doc.roundedRect(12, y, pw - 24, Math.min(fmBlockH, ph - y - 30), 3, 3, "F");
      doc.setTextColor(212, 168, 67);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("FACE MATCH RESULTS (100% CONFIDENCE)", 18, y + 8);
      doc.setTextColor(220, 50, 50);
      doc.text(`${faceMatches.length}`, pw - 15, y + 8, { align: "right" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(255, 255, 255);
      let fy = y + 15;
      if (faceMatches.length === 0) {
        doc.text("No 100% face matches detected.", 18, fy);
      } else {
        faceMatches.forEach((fm) => {
          checkPage(8);
          const line = `• ${fm.title.substring(0, 60)}${fm.title.length > 60 ? "…" : ""} — ${fm.url || "No URL"}`;
          doc.text(line, 18, fy, { maxWidth: pw - 36 });
          fy += 7;
        });
      }
      y = fy + 10;

      // Disclaimer
      checkPage(35);
      doc.setDrawColor(196, 18, 48);
      doc.setLineWidth(0.5);
      doc.line(12, y, pw - 12, y);
      y += 6;
      doc.setFontSize(7);
      doc.setTextColor(160, 160, 160);
      const disclaimer = "This document was generated by ClaimMyFace.com as a timestamped record of identity monitoring results. ClaimMyFace is not a law firm and this document does not constitute legal advice. This packet may be used to support copyright, trademark, right of publicity, or takedown matters in consultation with a qualified attorney.";
      doc.text(disclaimer, 12, y, { maxWidth: pw - 24 });

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text("© ClaimMyFace.com — Confidential", pw / 2, ph - 8, { align: "center" });

      doc.save(`ClaimMyFace-Evidence-Packet-${new Date().toISOString().slice(0, 10)}.pdf`);
      localStorage.setItem("cmf_evidence_generated", "1");
      toast({ title: "Evidence Packet PDF downloaded" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Evidence Packet</h1>
          <p className="text-muted-foreground mt-1">
            A timestamped summary of your identity protection and monitoring results — ready to share with an attorney.
          </p>
        </div>

        {/* Profile summary */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-[hsl(var(--gold))]" /> Actor Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Legal Name</span>
              <span className="font-medium">{actorName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Stage Name</span>
              <span className="font-medium">{stageName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Registration Date</span>
              <span className="font-medium">{regDate}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs uppercase tracking-wider">Registry ID</span>
              <span className="font-medium font-mono">{registryId || "Not assigned"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Scan results by type */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ScanSearch className="w-5 h-5 text-primary" /> Scan Results by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-muted-foreground">No scan results on record.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(grouped).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat} className="rounded-lg border border-border/30 bg-background/40 p-3 text-center">
                    <span className="text-2xl font-display font-bold">{count}</span>
                    <span className="block text-xs text-muted-foreground mt-1">{cat}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 text-sm text-muted-foreground">
              Total mentions: <span className="font-semibold text-foreground">{mentions.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Face matches */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" /> Face Match Results (100% Confidence)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {faceMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No 100% confidence face matches detected.</p>
            ) : (
              <div className="space-y-2">
                {faceMatches.map((fm) => (
                  <div key={fm.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Badge className="bg-red-600 text-white text-xs shrink-0">FACE MATCH</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{fm.title}</p>
                      {fm.url && (
                        <a href={fm.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                          {fm.url.substring(0, 60)}{fm.url.length > 60 ? "…" : ""}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk score */}
        <Card className={`border-border/40 bg-card/60 backdrop-blur-sm border-l-4 ${riskLevel === "HIGH" ? "border-l-red-500" : riskLevel === "MEDIUM" ? "border-l-yellow-500" : "border-l-emerald-500"}`}>
          <CardContent className="py-5 flex items-center gap-4">
            <RiskIcon className={`w-8 h-8 ${riskColor}`} />
            <div>
              <span className={`text-3xl font-display font-extrabold ${riskColor}`}>{riskScore}</span>
              <span className={`ml-2 text-lg font-semibold ${riskColor}`}>{riskLevel} RISK</span>
            </div>
          </CardContent>
        </Card>

        {/* Generate button */}
        <div className="flex justify-center pt-2">
          <Button
            size="lg"
            onClick={generatePDF}
            disabled={generating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-10 py-6 h-auto"
          >
            {generating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating…</>
            ) : (
              <><FileDown className="w-5 h-5 mr-2" /> Generate My Evidence Packet PDF</>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center italic pb-4">
          This is an automated risk flag only, not legal advice.
        </p>
      </motion.div>
    </DashboardLayout>
  );
};

export default EvidencePacketPage;
