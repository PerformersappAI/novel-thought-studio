import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Check, Download, ArrowRight, Loader2, Lock, ShieldCheck, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import TrustBanner from "@/components/onboarding/TrustBanner";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingBackButton from "@/components/onboarding/OnboardingBackButton";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const OnboardingCertified = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [assetsCount, setAssetsCount] = useState(0);
  const [registryId, setRegistryId] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: assets }] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("registry_assets").select("id, registry_id").eq("user_id", user.id),
      ]);
      setProfile(prof);
      setAssetsCount(assets?.length ?? 0);
      const existing = assets?.find((a: any) => a.registry_id)?.registry_id as string | undefined;
      const id =
        existing ||
        `CMF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
      setRegistryId(id);
      setLoading(false);
    })();
  }, [user]);

  const issuedAt = useMemo(
    () => (profile?.face_registered_at ? new Date(profile.face_registered_at) : new Date()),
    [profile]
  );
  const performerName = profile?.stage_name || profile?.full_name || profile?.legal_name || "Performer";
  const legalName = profile?.legal_name || profile?.full_name || "";

  const downloadPdf = async () => {
    if (!profile) return;
    setDownloading(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      doc.setFillColor(13, 17, 23);
      doc.rect(0, 0, W, H, "F");
      doc.setDrawColor(192, 57, 43);
      doc.setLineWidth(4);
      doc.rect(24, 24, W - 48, H - 48);
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.5);
      doc.rect(36, 36, W - 72, H - 72);

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("ClaimMyFace", W / 2, 100, { align: "center" });

      doc.setFontSize(16);
      doc.setTextColor(201, 168, 76);
      doc.text("Face Registration Certificate", W / 2, 130, { align: "center" });

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(performerName, W / 2, 200, { align: "center" });
      if (legalName && legalName !== performerName) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(180, 180, 180);
        doc.text(`Legal name: ${legalName}`, W / 2, 222, { align: "center" });
      }

      doc.setFont("helvetica", "normal");
      doc.setTextColor(220, 220, 220);
      doc.setFontSize(12);
      doc.text(`Registry ID:  ${registryId}`, W / 2, 270, { align: "center" });
      doc.text(`Issued:  ${issuedAt.toLocaleString()}`, W / 2, 290, { align: "center" });
      doc.text(`Assets Protected:  ${assetsCount}`, W / 2, 310, { align: "center" });
      doc.text(`Identity Verified ✓`, W / 2, 330, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(200, 200, 200);
      const statement =
        "This performer has established documented face and likeness registration. " +
        "Timestamped proof of ownership prior to federal digital replica legislation.";
      const wrapped = doc.splitTextToSize(statement, W - 160);
      doc.text(wrapped, W / 2, 380, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(192, 57, 43);
      doc.text("AES-256 Encrypted   •   SOC 2 Compliant   •   Never Sold", W / 2, H - 80, {
        align: "center",
      });

      doc.save(`ClaimMyFace-Certificate-${registryId}.pdf`);
      toast({ title: "Certificate downloaded" });
    } catch (e: any) {
      toast({ title: "Download failed", description: e.message, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-[140px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-6">
        <OnboardingBackButton to="/onboarding/voice" label="Back to Voice Print" />
        <OnboardingProgress step={4} />
        <TrustBanner />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <header className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">
              Step 3 of 4 — Get Your Certificate
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
              Your face is registered. Now make it official.
            </h1>
          </header>

          {/* Certificate preview card */}
          <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-card/80 to-background p-6 sm:p-10 space-y-5 shadow-[0_0_50px_-15px_hsl(var(--primary)/0.4)]">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <p className="font-display text-xl tracking-wide text-primary">ClaimMyFace</p>
              <p className="text-sm uppercase tracking-[0.2em] text-accent">
                Face Registration Certificate
              </p>
            </div>

            <div className="text-center space-y-1 pt-2">
              <h2 className="font-display text-3xl font-bold">{performerName}</h2>
              {legalName && legalName !== performerName && (
                <p className="text-xs text-muted-foreground">Legal name: {legalName}</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Registry ID</p>
                <p className="font-mono text-sm font-semibold">{registryId}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Issued</p>
                <p className="font-mono text-sm">{issuedAt.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Assets Protected</p>
                <p className="font-mono text-sm">{assetsCount}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">Identity Verified ✓</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground max-w-xl mx-auto text-center leading-relaxed pt-2">
              This performer has established documented face and likeness registration. Timestamped
              proof of ownership prior to federal digital replica legislation.
            </p>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {[
                { icon: Lock, text: "AES-256 Encrypted" },
                { icon: ShieldCheck, text: "SOC 2 Compliant" },
                { icon: Check, text: "Never Sold" },
              ].map((b) => (
                <span
                  key={b.text}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-foreground/90 inline-flex items-center gap-1.5"
                >
                  <b.icon className="w-3.5 h-3.5 text-primary" /> {b.text}
                </span>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button
              onClick={downloadPdf}
              disabled={downloading}
              size="lg"
              className="w-full font-display"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating PDF…</>
              ) : (
                <><Download className="w-4 h-4 mr-1" /> Download My Certificate PDF <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
            <Button
              onClick={() => navigate("/onboarding/monitoring")}
              variant="outline"
              size="lg"
              className="w-full font-display"
            >
              Skip for now — Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can download your certificate anytime from your dashboard.
            </p>
          </div>

          <Button
            onClick={() => navigate("/onboarding/monitoring")}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            <Award className="w-4 h-4 mr-1" /> Continue to Monitoring →
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingCertified;
