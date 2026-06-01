import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Link2, Upload, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DeepfakeInfo {
  verdict?: string;
  fake_score?: number;
  real_score?: number;
}

interface DomainInfo {
  domain?: string;
  ip?: string;
  registrar?: string;
  created?: string;
}

interface ReportResult {
  type?: string;
  deepfake?: DeepfakeInfo;
  domain_info?: DomainInfo;
  exif?: Record<string, any>;
  page_title?: string;
  note?: string;
  [k: string]: any;
}

const API_BASE = "https://api.claimmyface.com";

const formatPct = (n?: number) => {
  if (n == null) return null;
  const v = n <= 1 ? n * 100 : n;
  return `${Math.round(v)}%`;
};

const EvidenceReportCard = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"url" | "upload" | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setMode("url");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/build-case-file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e: any) {
      toast({ title: "Couldn't build report", description: "Try a direct image link or upload the file.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const analyzeUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMode("upload");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/build-case-file-upload`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setResult(await res.json());
    } catch (e: any) {
      toast({ title: "Couldn't build report", description: "Try a JPG, PNG, or WEBP under 8MB.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const df = result?.deepfake;
  const fakePct = formatPct(df?.fake_score);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-border/30 bg-card/40 p-6 space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Build an Evidence Report</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Found a suspicious image or post? Bring it here. We'll pull every technical detail that legally exists and assemble it into a dated report you can use for a takedown or share with a lawyer.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/30 bg-background/40 p-4 space-y-3">
          <Label className="flex items-center gap-2 text-sm">
            <Link2 className="w-4 h-4 text-primary" /> Paste an image link or social media URL
          </Label>
          <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} />
          <Button onClick={analyzeUrl} disabled={!url.trim() || loading} className="w-full">
            {loading && mode === "url" ? "Building report…" : "Analyze URL"}
          </Button>
        </div>

        <div className="rounded-xl border border-border/30 bg-background/40 p-4 space-y-3">
          <Label className="flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4 text-primary" /> Or upload an image
          </Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={loading}
          />
          <Button onClick={analyzeUpload} disabled={!file || loading} className="w-full">
            {loading && mode === "upload" ? "Building report…" : "Analyze Upload"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-border/30 bg-secondary/30 p-4 text-sm text-muted-foreground text-center">
          Building report… this can take up to 15 seconds.
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">AI Analysis</h3>
            {df?.verdict === "likely_fake" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-destructive">
                  ⚠️ Likely Manipulated — {fakePct} confidence
                </p>
              </div>
            )}
            {df?.verdict === "likely_real" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-emerald-500">✓ No strong signs of manipulation detected</p>
              </div>
            )}
            {!df && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/40">
                <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-muted-foreground">Social link — limited analysis available</p>
              </div>
            )}
          </div>

          {result.domain_info && Object.values(result.domain_info).some(Boolean) && (
            <div className="rounded-xl border border-border/30 bg-background/40 p-4">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Where It's Hosted</h3>
              <dl className="text-xs space-y-1">
                {(["domain", "ip", "registrar", "created"] as const).map((k) =>
                  result.domain_info?.[k] ? (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground capitalize">{k}</dt>
                      <dd className="text-foreground break-all text-right">{String(result.domain_info?.[k])}</dd>
                    </div>
                  ) : null
                )}
              </dl>
            </div>
          )}

          {result.exif !== undefined && (
            <div className="rounded-xl border border-border/30 bg-background/40 p-4">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Hidden Image Data (EXIF)</h3>
              {result.exif && Object.keys(result.exif).length > 0 ? (
                <dl className="text-xs space-y-1">
                  {Object.entries(result.exif).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-foreground break-all text-right">
                        {typeof v === "object" ? JSON.stringify(v) : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No embedded metadata found — common for AI-generated or scrubbed images.
                </p>
              )}
            </div>
          )}

          {result.page_title && (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Page title:</span> {result.page_title}
            </p>
          )}

          {result.note && <p className="text-xs text-muted-foreground">{result.note}</p>}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-3 border-t border-border/30">
        This report shows the technical evidence that legally exists in the file or link you provided. It can reveal where content is hosted and when it was created — but it cannot identify the person behind an anonymous account. That requires a subpoena through a lawyer. All AI detection is an estimate, not proof. This is not legal advice.
      </p>
    </motion.section>
  );
};

export default EvidenceReportCard;
