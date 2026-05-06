import { useState, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert, Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";

const FLAGGED_KEYWORDS = [
  "in perpetuity", "forever", "worldwide", "royalty-free", "all media",
  "now known or hereafter devised", "synthetic voice", "voice clone",
  "digital replica", "AI training", "machine learning", "likeness rights",
  "image rights", "performance capture", "motion capture", "scan", "avatar",
  "simulation", "derivative works", "sublicensable", "assignable", "irrevocable",
];

function findFlags(text: string): string[] {
  const lower = text.toLowerCase();
  return FLAGGED_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
}

function getRiskLevel(count: number): "green" | "yellow" | "red" {
  if (count === 0) return "green";
  if (count <= 3) return "yellow";
  return "red";
}

function highlightText(text: string, flags: string[]): React.ReactNode {
  if (flags.length === 0) return text;
  const escaped = flags.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (flags.some((f) => f.toLowerCase() === part.toLowerCase())) {
      return (
        <span key={i} className="bg-red-600/30 text-red-300 font-semibold px-0.5 rounded">
          {part}
        </span>
      );
    }
    return part;
  });
}

const riskConfig = {
  green: { label: "Low Risk", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", icon: CheckCircle },
  yellow: { label: "Medium Risk", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: AlertTriangle },
  red: { label: "High Risk", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", icon: ShieldAlert },
};

const ContractScannerPage = () => {
  const [text, setText] = useState("");
  const [flags, setFlags] = useState<string[]>([]);
  const [risk, setRisk] = useState<"green" | "yellow" | "red" | null>(null);
  const [scanned, setScanned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleScan = async () => {
    if (!text.trim()) {
      toast({ title: "Paste or upload contract text first", variant: "destructive" });
      return;
    }
    const found = findFlags(text);
    const level = getRiskLevel(found.length);
    setFlags(found);
    setRisk(level);
    setScanned(true);

    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("contracts").insert({
      user_id: user.id,
      extracted_text: text.substring(0, 50000),
      flagged_terms: found as any,
      risk_level: level,
    });
    setSaving(false);
    if (error) {
      console.error(error);
      toast({ title: "Could not save scan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Scan saved successfully" });
    }
  };

  const handlePDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Please upload a PDF file", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const { default: pdfjsLib } = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extracted = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        extracted += content.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setText(extracted);
      toast({ title: "PDF text extracted" });
    } catch (err) {
      console.error(err);
      toast({ title: "Could not extract PDF text", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const rc = risk ? riskConfig[risk] : null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Contract Scanner</h1>
          <p className="text-muted-foreground mt-1">Paste or upload a contract to flag risky AI and likeness clauses.</p>
        </div>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Contract Text</CardTitle>
            <CardDescription>Paste contract text below or upload a PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setScanned(false); }}
              placeholder="Paste your contract text here..."
              className="min-h-[200px] bg-background/50"
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleScan} disabled={saving} className="bg-primary hover:bg-primary/90">
                <ShieldAlert className="w-4 h-4 mr-2" />
                {saving ? "Saving…" : "Scan Contract"}
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? "Extracting…" : "Upload PDF"}
              </Button>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handlePDF} />
            </div>
          </CardContent>
        </Card>

        {scanned && rc && (
          <>
            <Card className={`border ${rc.bg}`}>
              <CardContent className="py-5 flex items-center gap-3">
                <rc.icon className={`w-6 h-6 ${rc.color}`} />
                <div>
                  <p className={`font-semibold text-lg ${rc.color}`}>{rc.label}</p>
                  <p className="text-sm text-muted-foreground">{flags.length} flagged term{flags.length !== 1 ? "s" : ""} found</p>
                </div>
              </CardContent>
            </Card>

            {flags.length > 0 && (
              <Card className="border-border/40 bg-card/60">
                <CardHeader>
                  <CardTitle className="text-lg">Flagged Terms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {flags.map((f) => (
                      <span key={f} className="px-2 py-1 rounded text-xs font-medium bg-red-600/20 text-red-300 border border-red-500/30">
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="bg-background/50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                    {highlightText(text, flags)}
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground text-center italic">
              This is an automated risk flag, not a legal interpretation.
            </p>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ContractScannerPage;
