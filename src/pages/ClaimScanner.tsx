import { useState, useRef } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link as LinkIcon, ShieldCheck, ShieldAlert, Loader2, Download, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Status = "idle" | "analyzing" | "authentic" | "manipulated";
type Verdict = "likely-authentic" | "likely-ai" | "uncertain" | "inconclusive";

const getVerdict = (detection: "Authentic" | "Manipulated", confidence: number): Verdict => {
  if (confidence < 50) return "inconclusive";
  if (confidence < 85) return "uncertain";
  return detection === "Authentic" ? "likely-authentic" : "likely-ai";
};

const VERDICT_META: Record<Verdict, { label: string; color: string; bg: string; border: string }> = {
  "likely-authentic": { label: "Likely Authentic", color: "text-green-500", bg: "bg-green-500", border: "border-green-500/50" },
  "likely-ai":        { label: "Likely AI-Generated", color: "text-destructive", bg: "bg-destructive", border: "border-destructive/50" },
  "uncertain":        { label: "Uncertain — low confidence result", color: "text-yellow-500", bg: "bg-yellow-500", border: "border-yellow-500/50" },
  "inconclusive":     { label: "Inconclusive", color: "text-muted-foreground", bg: "bg-muted-foreground", border: "border-border" },
};

const isScreenshotName = (name: string) => /screen[\s_-]?shot/i.test(name);

interface ForensicResult {
  target: string;
  date: string;
  detection: "Authentic" | "Manipulated";
  confidence: number;
  aiModel: string | null;
  domainInfo: string | null;
  notes: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildResult = (
  target: string,
  data: any,
  domainInfo: string | null,
): ForensicResult => ({
  target,
  date: new Date().toISOString(),
  detection: data.detection,
  confidence: data.confidence,
  aiModel:
    data.detection === "Manipulated"
      ? data.aiGenScore >= data.deepfakeScore
        ? "AI-Generated (Sightengine genai)"
        : "Deepfake (Sightengine deepfake)"
      : null,
  domainInfo,
  notes: `Sightengine deepfake score: ${(data.deepfakeScore * 100).toFixed(1)}%. AI-generated score: ${(data.aiGenScore * 100).toFixed(1)}%.`,
});

const analyzeUrl = async (url: string): Promise<ForensicResult> => {
  let host = "";
  try { host = new URL(url).hostname; } catch { host = "invalid"; }
  const { data, error } = await supabase.functions.invoke("sightengine-scan", {
    body: { url },
  });
  if (error || !data?.success) throw new Error(error?.message || data?.error || "Scan failed");
  return buildResult(url, data, host ? `Host: ${host}` : null);
};

const analyzeFile = async (file: File): Promise<ForensicResult> => {
  const fileBase64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke("sightengine-scan", {
    body: { fileBase64, fileName: file.name, mimeType: file.type },
  });
  if (error || !data?.success) throw new Error(error?.message || data?.error || "Scan failed");
  return buildResult(
    `${file.name} (${(file.size / 1024).toFixed(1)} KB, ${file.type || "unknown"})`,
    data,
    null,
  );
};

const ClaimScanner = () => {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ForensicResult | null>(null);
  const [scannedFileName, setScannedFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const VIDEO_HOSTS = [
    "youtube.com", "youtu.be", "tiktok.com", "vimeo.com",
    "dailymotion.com", "twitch.tv", "facebook.com/watch",
    "fb.watch", "instagram.com/reel", "instagram.com/tv",
  ];

  const isVideoPlatformUrl = (raw: string) => {
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, "");
      const full = host + u.pathname;
      return VIDEO_HOSTS.some((h) => host === h || host.endsWith("." + h) || full.startsWith(h));
    } catch {
      return false;
    }
  };

  const runUrlScan = async () => {
    if (!url.trim()) {
      toast({ title: "Enter a URL", description: "Paste a URL to scan.", variant: "destructive" });
      return;
    }
    if (isVideoPlatformUrl(url.trim())) {
      toast({
        title: "Video URL detected",
        description: "Please upload a screenshot or image file from this video to scan it for deepfakes. We currently scan images only.",
        variant: "destructive",
      });
      return;
    }
    setStatus("analyzing");
    setResult(null);
    setScannedFileName(null);
    try {
      const r = await analyzeUrl(url.trim());
      setResult(r);
      setStatus(r.detection === "Authentic" ? "authentic" : "manipulated");
    } catch (e: any) {
      toast({ title: "Scan failed", description: e?.message ?? "Unknown error", variant: "destructive" });
      setStatus("idle");
    }
  };

  const runFileScan = async (file: File) => {
    setStatus("analyzing");
    setResult(null);
    setScannedFileName(file.name);
    try {
      const r = await analyzeFile(file);
      setResult(r);
      setStatus(r.detection === "Authentic" ? "authentic" : "manipulated");
    } catch (e: any) {
      toast({ title: "Scan failed", description: e?.message ?? "Unknown error", variant: "destructive" });
      setStatus("idle");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) runFileScan(f);
  };

  const downloadReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Forensic Analysis Report", 20, 20);
    doc.setFontSize(10);
    doc.text("ClaimMyFace Claim Scanner", 20, 28);
    doc.line(20, 32, 190, 32);

    const rows: [string, string][] = [
      ["Target", result.target],
      ["Date / Time", new Date(result.date).toLocaleString()],
      ["Detection Result", result.detection],
      ["Confidence Score", `${result.confidence}%`],
      ["AI Model Detected", result.aiModel || "None"],
      ["Domain / IP Info", result.domainInfo || "N/A"],
    ];
    let y = 44;
    doc.setFontSize(11);
    rows.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 20, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(v, 120);
      doc.text(lines, 70, y);
      y += 8 + (lines.length - 1) * 6;
    });
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 20, y);
    doc.setFont("helvetica", "normal");
    const notes = doc.splitTextToSize(result.notes, 170);
    doc.text(notes, 20, y + 6);

    doc.save(`forensic-report-${Date.now()}.pdf`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Claim Scanner</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Submit a suspicious URL, image, video, or audio file for forensic analysis. We'll tell you
            if it's AI-generated and generate a report you can use for DMCA or cease-and-desist.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Scan a URL
              </CardTitle>
              <CardDescription>Paste a link to an image, video, post, or page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/suspicious-content"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={runUrlScan} disabled={status === "analyzing"} className="w-full">
                {status === "analyzing" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan URL"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="w-4 h-4" /> Scan a File
              </CardTitle>
              <CardDescription>Image, video, or audio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) runFileScan(f);
                }}
              />
              <Button
                onClick={() => fileRef.current?.click()}
                disabled={status === "analyzing"}
                variant="outline"
                className="w-full"
              >
                {status === "analyzing" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Scan File"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSearch className="w-4 h-4" /> Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === "idle" && (
              <p className="text-sm text-muted-foreground">No scan run yet. Submit a URL or file above.</p>
            )}
            {status === "analyzing" && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </div>
            )}
            {result && status !== "analyzing" && (() => {
              const verdict = getVerdict(result.detection, result.confidence);
              const meta = VERDICT_META[verdict];
              const showScreenshotWarning = !!scannedFileName && isScreenshotName(scannedFileName);
              const isAuthenticLike = verdict === "likely-authentic";
              return (
              <div className="space-y-5">
                {showScreenshotWarning && (
                  <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                    ⚠️ This looks like a screenshot. Screenshots remove the digital fingerprints AI detectors need. For accurate results, upload the original image file.
                  </div>
                )}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {isAuthenticLike ? (
                      <ShieldCheck className={cn("w-8 h-8", meta.color)} />
                    ) : (
                      <ShieldAlert className={cn("w-8 h-8", meta.color)} />
                    )}
                    <div>
                      <div className={cn("text-xl font-semibold", meta.color)}>
                        {meta.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {result.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full sm:w-64">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn("h-full", meta.bg)}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold mb-3">Forensic Report</h3>
                  <ReportRow label="File / URL" value={result.target} />
                  <ReportRow label="Date / Time" value={new Date(result.date).toLocaleString()} />
                  <ReportRow label="Verdict" value={meta.label} />
                  <ReportRow label="Raw Detection" value={result.detection} />
                  <ReportRow label="Confidence" value={`${result.confidence}%`} />
                  <ReportRow label="AI Model Detected" value={result.aiModel || "None"} />
                  <ReportRow label="Domain / IP" value={result.domainInfo || "N/A"} />
                </div>
              );
            })()}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={downloadReport} className="gap-2">
                    <Download className="w-4 h-4" /> Download Report
                  </Button>
                  {status === "manipulated" && (
                    <>
                      <Button asChild variant="destructive" className="gap-2">
                        <a href={`/dashboard/dmca-generator?target=${encodeURIComponent(result.target)}`}>
                          Generate DMCA Notice
                        </a>
                      </Button>
                      <Button asChild variant="outline">
                        <a href="/dashboard/take-action">Take Action</a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const ReportRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-3 gap-3 text-sm py-1.5 border-b border-border/30 last:border-0">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2 break-words">{value}</div>
  </div>
);

export default ClaimScanner;
