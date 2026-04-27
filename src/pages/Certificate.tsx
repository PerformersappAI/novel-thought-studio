import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Download, Copy, Check, FileText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import logo from "@/assets/cmf-shield-logo.png";

interface CertData {
  fullName: string;
  registryId: string;
  firstRegisteredAt: string;
  assetsCount: number;
  verified: boolean;
  hash: string;
}

const Certificate = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: profile }, { data: assets }, { data: verification }] = await Promise.all([
        supabase.from("profiles").select("full_name, stage_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("registry_assets").select("id, registry_id, file_hash, created_at").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("identity_verifications").select("status").eq("user_id", user.id).maybeSingle(),
      ]);

      const first = assets?.[0];
      const registryId = first?.registry_id || `CMF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
      setData({
        fullName: profile?.stage_name || profile?.full_name || "Performer",
        registryId,
        firstRegisteredAt: first?.created_at || new Date().toISOString(),
        assetsCount: assets?.length ?? 0,
        verified: verification?.status === "approved",
        hash: first?.file_hash || "0000000000000000",
      });
      setLoading(false);
    };
    load();
  }, [user]);

  const verifyUrl = data ? `${window.location.origin}/verify/${data.registryId}` : "";

  const downloadPdf = async () => {
    if (!data) return;
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      // Background — dark navy
      doc.setFillColor(13, 17, 23);
      doc.rect(0, 0, W, H, "F");

      // Crimson border
      doc.setDrawColor(192, 57, 43);
      doc.setLineWidth(4);
      doc.rect(24, 24, W - 48, H - 48);

      // Inner gold border
      doc.setDrawColor(201, 168, 76);
      doc.setLineWidth(0.5);
      doc.rect(36, 36, W - 72, H - 72);

      // Header — ClaimMyFace
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.text("ClaimMyFace", W / 2, 100, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(201, 168, 76);
      doc.text("MY FACE. MY CLAIM.", W / 2, 118, { align: "center" });

      // Title
      doc.setTextColor(192, 57, 43);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("FACE REGISTRATION CERTIFICATE", W / 2, 170, { align: "center" });

      // Divider
      doc.setDrawColor(192, 57, 43);
      doc.setLineWidth(1);
      doc.line(W / 2 - 80, 185, W / 2 + 80, 185);

      // Performer name
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("This certifies that", W / 2, 220, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.text(data.fullName, W / 2, 252, { align: "center" });

      // Details table
      const startY = 300;
      const labelX = 100;
      const valueX = 280;
      const lineH = 26;
      doc.setFontSize(11);

      const rows = [
        ["Registry ID", data.registryId],
        ["First Registered", new Date(data.firstRegisteredAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
        ["Assets Protected", String(data.assetsCount)],
        ["Identity Status", data.verified ? "Verified" : "Pending"],
        ["Cryptographic Hash", data.hash.substring(0, 16) + "..."],
      ];

      rows.forEach((r, i) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 170);
        doc.text(r[0], labelX, startY + i * lineH);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text(r[1], valueX, startY + i * lineH);
      });

      // Statement
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 210);
      const statement = "This performer has established documented face and likeness registration. This certificate serves as timestamped proof of ownership prior to the enactment of federal digital replica legislation.";
      const wrapped = doc.splitTextToSize(statement, W - 160);
      doc.text(wrapped, W / 2, 470, { align: "center" });

      // QR code
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 200, margin: 1, color: { dark: "#0d1117", light: "#ffffff" } });
      doc.addImage(qrDataUrl, "PNG", W / 2 - 50, 530, 100, 100);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 170);
      doc.text("Verify at " + verifyUrl, W / 2, 650, { align: "center" });

      // Seal text
      doc.setTextColor(192, 57, 43);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("CLAIMMYFACE CERTIFIED", W / 2, 690, { align: "center" });

      // Footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 150);
      doc.text(`Issued ${new Date().toLocaleDateString()} · ClaimMyFace Digital Registry`, W / 2, H - 60, { align: "center" });

      doc.save(`ClaimMyFace-Certificate-${data.registryId}.pdf`);
      try { localStorage.setItem("cmf_cert_downloaded", "1"); } catch {}
      toast.success("Certificate downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    }
  };

  const embedCode = data
    ? `<a href="${verifyUrl}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:10px 16px;background:#0d1117;border:1px solid #C0392B;border-radius:8px;color:#fff;font-family:system-ui,sans-serif;text-decoration:none;font-size:13px"><svg width="20" height="20" viewBox="0 0 24 24" fill="#C0392B" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4z"/></svg><span><strong style="color:#C0392B">ClaimMyFace</strong> Certified · ${data.registryId} · ${new Date(data.firstRegisteredAt).toLocaleDateString()}</span></a>`
    : "";

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success("Embed code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-muted-foreground">Loading certificate…</div>
      </DashboardLayout>
    );
  }

  if (!data || data.assetsCount === 0) {
    return (
      <DashboardLayout>
        <Card className="glass-card border-border/30">
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Register at least one asset to generate your Face Registration Certificate.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Face Registration Certificate</h1>
            <p className="text-muted-foreground mt-1">Your timestamped proof of likeness ownership.</p>
          </div>
          <Button onClick={downloadPdf} className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
        </div>

        {/* Certificate display */}
        <Card className="border-2 border-[#C0392B] bg-[#0d1117] overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="border border-[#C9A84C]/30 p-6 md:p-10 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src={logo} alt="ClaimMyFace" className="h-10 w-auto" />
              </div>
              <p className="text-[#C9A84C] tracking-[0.3em] text-xs mb-8">MY FACE. MY CLAIM.</p>

              <h2 className="font-display text-2xl md:text-3xl font-bold text-[#C0392B] tracking-wide">
                FACE REGISTRATION CERTIFICATE
              </h2>
              <div className="w-24 h-0.5 bg-[#C0392B] mx-auto my-4" />

              <p className="text-sm text-muted-foreground mb-2">This certifies that</p>
              <p className="font-display text-3xl md:text-4xl font-bold text-white mb-10">{data.fullName}</p>

              <div className="grid sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto mb-10">
                {[
                  ["Registry ID", data.registryId],
                  ["First Registered", new Date(data.firstRegisteredAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })],
                  ["Assets Protected", String(data.assetsCount)],
                  ["Identity Status", data.verified ? "Verified ✓" : "Pending"],
                ].map(([k, v]) => (
                  <div key={k} className="border-l-2 border-[#C0392B]/50 pl-3">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">{k}</div>
                    <div className="text-white font-medium font-mono text-sm mt-1">{v}</div>
                  </div>
                ))}
                <div className="border-l-2 border-[#C0392B]/50 pl-3 sm:col-span-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Cryptographic Hash</div>
                  <div className="text-white font-mono text-sm mt-1 break-all">{data.hash.substring(0, 16)}…</div>
                </div>
              </div>

              <p className="italic text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
                "This performer has established documented face and likeness registration. This certificate serves as timestamped proof of ownership prior to the enactment of federal digital replica legislation."
              </p>

              {/* Seal */}
              <div className="inline-flex flex-col items-center">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-[#C0392B]" />
                  <div className="absolute inset-2 rounded-full border border-[#C9A84C]/40" />
                  <Shield className="w-10 h-10 text-[#C0392B]" fill="currentColor" />
                </div>
                <p className="text-[#C0392B] font-bold tracking-widest text-xs mt-2">CLAIMMYFACE CERTIFIED</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embeddable badge */}
        <Card className="glass-card border-border/30 mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">Embeddable Badge</h3>
                <p className="text-sm text-muted-foreground">Add this badge to your website to display your registration.</p>
              </div>
              <Button onClick={copyEmbed} variant="outline" size="sm">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
            </div>

            {/* Live preview */}
            <div className="p-4 rounded-lg bg-[#0d1117] border border-border/30 mb-4 flex items-center justify-center">
              <a href={verifyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-[#0d1117] border border-[#C0392B] rounded-lg text-white text-xs hover:bg-[#C0392B]/10 transition-colors">
                <Shield className="w-4 h-4 text-[#C0392B]" fill="currentColor" />
                <span><strong className="text-[#C0392B]">ClaimMyFace</strong> Certified · {data.registryId} · {new Date(data.firstRegisteredAt).toLocaleDateString()}</span>
              </a>
            </div>

            <pre className="text-xs bg-secondary/30 border border-border/30 rounded-lg p-3 overflow-x-auto text-muted-foreground">
              <code>{embedCode}</code>
            </pre>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default Certificate;
