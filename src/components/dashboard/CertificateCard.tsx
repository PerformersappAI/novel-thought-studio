import { useEffect, useMemo, useState } from "react";
import { Shield, Check, Download, Loader2, Lock, ShieldCheck, Copy, ExternalLink, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import cmfBadge from "@/assets/cmf-registered-badge.png";
import { embedWatermark, downloadBlob } from "@/lib/stegoWatermark";
import { resolveHeadshotUrl } from "@/lib/headshotUrl";

interface Props {
  profile: any;
}

const NAVY = [11, 21, 38] as const;       // #0B1526
const NAVY_LIGHT = [20, 35, 60] as const; // panel
const GOLD = [212, 168, 67] as const;     // #D4A843
const CRIMSON = [196, 18, 48] as const;   // #C41230
const PARCHMENT = [232, 222, 196] as const;

async function sha256OfUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch { return null; }
}

async function sha256OfString(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function loadImageDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

const CertificateCard = ({ profile }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificateId, setCertificateId] = useState<string>("");
  const [faceHash, setFaceHash] = useState<string>("");
  const [voiceHash, setVoiceHash] = useState<string>("");
  const [issuedAt, setIssuedAt] = useState<Date>(new Date());
  const [downloading, setDownloading] = useState(false);
  const [ready, setReady] = useState(false);

  const performerName = profile?.stage_name || profile?.full_name || profile?.legal_name || "Performer";
  const legalName = profile?.legal_name || profile?.full_name || "";
  const rawHeadshot: string | null = profile?.headshot_url || profile?.avatar_url || null;
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolveHeadshotUrl(rawHeadshot).then((u) => { if (!cancelled) setHeadshotUrl(u); });
    return () => { cancelled = true; };
  }, [rawHeadshot]);
  const voiceUrl: string | null = profile?.voice_print_url || profile?.voice_print_demo_url || null;

  const hasMinimum = !!(performerName && headshotUrl);

  // Provision / load credential
  useEffect(() => {
    if (!user || !hasMinimum) return;
    let cancelled = false;
    (async () => {
      // 1. Compute hashes
      const [fh, vh] = await Promise.all([
        headshotUrl ? sha256OfUrl(headshotUrl) : Promise.resolve(null),
        voiceUrl ? sha256OfUrl(voiceUrl) : Promise.resolve(null),
      ]);
      const safeFace = fh || (await sha256OfString(headshotUrl || user.id));
      const safeVoice = vh || "";

      // 2. Look up existing credential
      const { data: existing } = await supabase
        .from("credentials")
        .select("certificate_id, issued_at, face_hash, voice_hash")
        .eq("actor_id", user.id)
        .order("issued_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (existing) {
        setCertificateId(existing.certificate_id);
        setIssuedAt(new Date(existing.issued_at));
        setFaceHash(existing.face_hash || safeFace);
        setVoiceHash(existing.voice_hash || safeVoice);
        // Refresh hashes if changed
        if ((fh && fh !== existing.face_hash) || (vh && vh !== existing.voice_hash)) {
          await supabase.from("credentials").update({
            face_hash: safeFace, voice_hash: safeVoice, headshot_url: headshotUrl,
            legal_name: legalName, stage_name: profile?.stage_name || null,
          }).eq("certificate_id", existing.certificate_id);
          setFaceHash(safeFace); setVoiceHash(safeVoice);
        }
      } else {
        // 3. Create new credential
        const certId = `CMF-${new Date().getFullYear()}-${(crypto.randomUUID().replace(/-/g, "").slice(0, 10)).toUpperCase()}`;
        const { data: inserted, error } = await supabase
          .from("credentials")
          .insert({
            actor_id: user.id,
            certificate_id: certId,
            legal_name: legalName || null,
            stage_name: profile?.stage_name || null,
            face_hash: safeFace,
            voice_hash: safeVoice || null,
            headshot_url: headshotUrl,
            is_valid: true,
          })
          .select("certificate_id, issued_at")
          .single();
        if (!error && inserted && !cancelled) {
          setCertificateId(inserted.certificate_id);
          setIssuedAt(new Date(inserted.issued_at));
          setFaceHash(safeFace);
          setVoiceHash(safeVoice);
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, headshotUrl, voiceUrl, legalName, profile?.stage_name, hasMinimum]);

  const verifyUrl = useMemo(
    () => certificateId ? `${window.location.origin}/verify/${certificateId}` : "",
    [certificateId]
  );

  if (!hasMinimum) return null;

  const copyLink = async () => {
    if (!verifyUrl) return;
    await navigator.clipboard.writeText(verifyUrl);
    toast({ title: "Verification link copied" });
  };

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // Background — deep navy
      doc.setFillColor(...NAVY); doc.rect(0, 0, W, H, "F");
      // Subtle inner navy panel
      doc.setFillColor(...NAVY_LIGHT); doc.rect(28, 28, W - 56, H - 56, "F");
      // Gold double border
      doc.setDrawColor(...GOLD); doc.setLineWidth(2.5); doc.rect(28, 28, W - 56, H - 56);
      doc.setLineWidth(0.5); doc.rect(40, 40, W - 80, H - 80);

      // Top eyebrow
      doc.setTextColor(...GOLD); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("CLAIMMYFACE  •  IDENTITY CREDENTIAL  •  C2PA-COMPATIBLE", W / 2, 70, { align: "center" });

      // Shield emblem
      const cx = W / 2, cy = 130;
      doc.setDrawColor(...GOLD); doc.setLineWidth(1.5);
      doc.setFillColor(...CRIMSON);
      // simple shield shape via polygon
      const sw = 38;
      // @ts-ignore
      doc.lines([[sw, 0], [-2, 28], [-(sw - 4), 22], [-(sw - 4), -22], [-2, -28]], cx - sw, cy - 30, [1, 1], "FD");
      doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
      doc.text("CMF", cx, cy + 4, { align: "center" });

      // Title
      doc.setTextColor(...PARCHMENT); doc.setFont("times", "bold"); doc.setFontSize(26);
      doc.text("Identity Credential Certificate", W / 2, 200, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(180, 180, 190);
      doc.text("Cryptographically signed proof of identity registration", W / 2, 220, { align: "center" });

      // Performer photo (round-ish — jsPDF doesn't clip, draw a gold frame)
      const photoData = await loadImageDataUrl(headshotUrl);
      const px = W / 2 - 55, py = 245, pw = 110, ph = 130;
      doc.setFillColor(255, 255, 255); doc.rect(px - 4, py - 4, pw + 8, ph + 8, "F");
      doc.setDrawColor(...GOLD); doc.setLineWidth(2); doc.rect(px - 4, py - 4, pw + 8, ph + 8);
      if (photoData) {
        try { doc.addImage(photoData, "JPEG", px, py, pw, ph); }
        catch { try { doc.addImage(photoData, "PNG", px, py, pw, ph); } catch {} }
      }

      // Name
      let y = py + ph + 38;
      doc.setTextColor(...PARCHMENT); doc.setFont("times", "bold"); doc.setFontSize(22);
      doc.text(performerName, W / 2, y, { align: "center" });
      if (legalName && legalName !== performerName) {
        y += 18;
        doc.setFont("helvetica", "italic"); doc.setFontSize(11); doc.setTextColor(200, 200, 210);
        doc.text(`Legal name: ${legalName}`, W / 2, y, { align: "center" });
      }

      // Gold separator
      y += 24;
      doc.setDrawColor(...GOLD); doc.setLineWidth(0.6);
      doc.line(W / 2 - 100, y, W / 2 + 100, y);

      // Metadata block
      y += 22;
      const meta: [string, string][] = [
        ["Certificate ID", certificateId],
        ["Issued (UTC)", issuedAt.toISOString()],
        ["Issuing Authority", "ClaimMyFace Registry"],
        ["Face SHA-256", `${faceHash.slice(0, 24)}…${faceHash.slice(-12)}`],
      ];
      if (voiceHash) meta.push(["Voice SHA-256", `${voiceHash.slice(0, 24)}…${voiceHash.slice(-12)}`]);
      meta.push(["Verify At", verifyUrl.replace(/^https?:\/\//, "")]);

      doc.setFont("helvetica", "normal"); doc.setFontSize(10);
      for (const [k, v] of meta) {
        doc.setTextColor(...GOLD); doc.text(k.toUpperCase(), W / 2 - 180, y);
        doc.setTextColor(230, 230, 235); doc.setFont("courier", "normal");
        doc.text(v, W / 2 - 60, y);
        doc.setFont("helvetica", "normal");
        y += 16;
      }

      // Statement
      y += 14;
      doc.setTextColor(210, 210, 220); doc.setFont("times", "italic"); doc.setFontSize(10);
      const statement =
        "This certificate attests that the performer named above has registered their facial likeness and identity " +
        "with ClaimMyFace, a digital rights registry. The cryptographic hashes recorded herein establish a " +
        "tamper-evident timestamp of ownership prior to any unauthorized synthetic reproduction.";
      const wrapped = doc.splitTextToSize(statement, W - 160);
      doc.text(wrapped, W / 2, y, { align: "center" });

      // Footer seals
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...GOLD);
      doc.text("AES-256 ENCRYPTED  •  SHA-256 SIGNED  •  C2PA-COMPATIBLE  •  SOC 2 COMPLIANT", W / 2, H - 70, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(160, 160, 170);
      doc.text(`Verify authenticity: ${verifyUrl}`, W / 2, H - 55, { align: "center" });

      doc.save(`ClaimMyFace-Credential-${certificateId}.pdf`);
      toast({ title: "Certificate downloaded" });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-[#0B1526] to-[#142340] p-6 sm:p-8 space-y-5 shadow-[0_0_60px_-15px_rgba(212,168,67,0.35)]">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center">
          <Shield className="w-7 h-7 text-accent" />
        </div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-accent">ClaimMyFace · C2PA-Compatible</p>
        <h3 className="font-display text-2xl text-foreground">Identity Credential Certificate</h3>
      </div>

      <div className="text-center space-y-1">
        <p className="font-display text-xl font-bold text-foreground">{performerName}</p>
        {legalName && legalName !== performerName && (
          <p className="text-xs text-muted-foreground">Legal name: {legalName}</p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
        <div className="rounded-lg border border-accent/30 bg-background/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-accent">Certificate ID</p>
          <p className="font-mono text-sm font-semibold break-all">{certificateId || "—"}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Issued</p>
          <p className="font-mono text-sm">{issuedAt.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Face SHA-256</p>
          <p className="font-mono text-[10px] break-all text-foreground/80">{faceHash || "Computing…"}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Voice SHA-256</p>
          <p className="font-mono text-[10px] break-all text-foreground/80">{voiceHash || "Not provided"}</p>
        </div>
      </div>

      {verifyUrl && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 flex flex-wrap items-center gap-3 max-w-xl mx-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-xs break-all flex-1 min-w-0">{verifyUrl}</span>
          <Button size="sm" variant="ghost" onClick={copyLink} className="h-7">
            <Copy className="w-3.5 h-3.5 mr-1" /> Copy
          </Button>
          <a href={verifyUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="ghost" className="h-7">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
            </Button>
          </a>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {[
          { icon: Lock, text: "AES-256 Encrypted" },
          { icon: ShieldCheck, text: "SHA-256 Signed" },
          { icon: Check, text: "C2PA-Compatible" },
        ].map((b) => (
          <span key={b.text} className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-foreground/90 inline-flex items-center gap-1.5">
            <b.icon className="w-3.5 h-3.5 text-accent" /> {b.text}
          </span>
        ))}
      </div>

      <Button onClick={downloadPdf} disabled={downloading || !ready} size="lg" className="w-full font-display bg-accent text-accent-foreground hover:bg-accent/90">
        {downloading ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating PDF…</>) :
          (<><Download className="w-4 h-4 mr-1" /> Download Identity Credential PDF</>)}
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="w-full"
        disabled={!ready || !headshotUrl}
        onClick={async () => {
          if (!headshotUrl) return;
          try {
            const blob = await embedWatermark(headshotUrl, {
              certificateId,
              stageName: performerName,
              registrationDate: issuedAt.toISOString(),
              issuer: "ClaimMyFace.com",
            });
            downloadBlob(blob, `ClaimMyFace-Protected-${certificateId || "headshot"}.png`);
            toast({ title: "Protected headshot downloaded", description: "Invisible watermark embedded." });
          } catch (e: any) {
            toast({ title: "Could not watermark image", description: e.message, variant: "destructive" });
          }
        }}
      >
        <ImageIcon className="w-4 h-4 mr-2" /> Download Protected Headshot
      </Button>

      {/* Shareable "CMF Registered" badge */}
      <div className="pt-4 border-t border-accent/20">
        <div className="text-center mb-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent flex items-center justify-center gap-2">
            <ImageIcon className="w-3 h-3" /> Protected Badge
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap the seal to download. Post it on your website or social profiles to show you're registered.
          </p>
        </div>
        <div className="flex justify-center">
          <a
            href={cmfBadge}
            download={`ClaimMyFace-Registered-Badge-${certificateId || "CMF"}.png`}
            className="group block relative"
            title="Click to download full-size badge"
          >
            <img
              src={cmfBadge}
              alt="CMF Registered — Don't Steal My Image"
              className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-contain transition-transform group-hover:scale-105 drop-shadow-[0_0_30px_rgba(212,168,67,0.35)]"
            />
            <span className="absolute inset-0 rounded-full flex items-center justify-center bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                <Download className="w-4 h-4" /> Download
              </span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
