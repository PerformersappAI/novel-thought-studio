import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, ShieldAlert, Upload, Link as LinkIcon, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import exifr from "exifr";

type Tab = "url" | "file";
type Status = "idle" | "analyzing" | "authentic" | "manipulated" | "error";

interface MetaRow { label: string; value: string }

const STORAGE_KEY = "cmf_free_scan_used";

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

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

const extractUrlMeta = (raw: string): MetaRow[] => {
  try {
    const u = new URL(raw);
    const rows: MetaRow[] = [
      { label: "Source", value: u.hostname },
      { label: "Path", value: u.pathname || "/" },
    ];
    if (u.search) rows.push({ label: "Query", value: u.search.slice(0, 80) });
    const ext = u.pathname.split(".").pop();
    if (ext && ext.length <= 5) rows.push({ label: "File type", value: ext.toLowerCase() });
    return rows;
  } catch {
    return [{ label: "Source", value: "Invalid URL" }];
  }
};

const extractFileMeta = async (file: File): Promise<MetaRow[]> => {
  const rows: MetaRow[] = [
    { label: "Filename", value: file.name },
    { label: "Type", value: file.type || "unknown" },
    { label: "Size", value: formatBytes(file.size) },
    { label: "Modified", value: new Date(file.lastModified).toLocaleString() },
  ];
  if (file.type.startsWith("image/")) {
    try {
      const exif: any = await exifr.parse(file, true);
      if (exif) {
        if (exif.Make || exif.Model) rows.push({ label: "Camera", value: `${exif.Make ?? ""} ${exif.Model ?? ""}`.trim() });
        if (exif.Software) rows.push({ label: "Software", value: String(exif.Software) });
        if (exif.DateTimeOriginal) rows.push({ label: "Captured", value: new Date(exif.DateTimeOriginal).toLocaleString() });
        if (exif.latitude && exif.longitude) rows.push({ label: "GPS", value: `${exif.latitude.toFixed(4)}, ${exif.longitude.toFixed(4)}` });
        if (exif.ImageWidth && exif.ImageHeight) rows.push({ label: "Dimensions", value: `${exif.ImageWidth}×${exif.ImageHeight}` });
      } else {
        rows.push({ label: "EXIF", value: "No metadata embedded" });
      }
    } catch {
      rows.push({ label: "EXIF", value: "Unreadable" });
    }
  }
  return rows;
};

const HeroFreeScanWidget = () => {
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [confidence, setConfidence] = useState(0);
  const [meta, setMeta] = useState<MetaRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [used, setUsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  useEffect(() => {
    // Free & unlimited trial — do not gate scans
    setUsed(false);
  }, []);

  const handleScan = async () => {
    setStatus("analyzing");
    setErrorMsg(null);
    setMeta([]);
    try {
      let metaRows: MetaRow[] = [];
      let invokeBody: Record<string, unknown> = {};

      if (tab === "url") {
        if (!url.trim()) return;
        metaRows = extractUrlMeta(url.trim());
        invokeBody = { url: url.trim() };
      } else {
        if (!pendingFile.current) return;
        metaRows = await extractFileMeta(pendingFile.current);
        const fileBase64 = await fileToBase64(pendingFile.current);
        invokeBody = {
          fileBase64,
          fileName: pendingFile.current.name,
          mimeType: pendingFile.current.type,
        };
      }

      const { data, error } = await supabase.functions.invoke("sightengine-scan", { body: invokeBody });
      if (error || !data?.success) throw new Error(error?.message || data?.error || "Scan failed");

      setMeta(metaRows);
      setConfidence(data.confidence);
      setStatus(data.detection === "Manipulated" ? "manipulated" : "authentic");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Scan failed");
      setStatus("error");
    }
  };

  const onFile = (f: File | null) => {
    pendingFile.current = f;
    setFileName(f?.name ?? null);
  };

  const disabled = status === "analyzing" || used || (tab === "url" ? !url.trim() : !fileName);

  return (
    <div className="mt-6 rounded-2xl glass-card p-4 md:p-5 w-full max-w-xl mx-auto md:mx-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex rounded-lg bg-white/[0.04] border border-white/10 p-1">
          <button
            onClick={() => setTab("url")}
            className={cn(
              "px-3 py-1.5 text-xs font-body rounded-md transition-colors flex items-center gap-1.5",
              tab === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LinkIcon className="w-3.5 h-3.5" /> Paste a URL
          </button>
          <button
            onClick={() => setTab("file")}
            className={cn(
              "px-3 py-1.5 text-xs font-body rounded-md transition-colors flex items-center gap-1.5",
              tab === "file" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Upload className="w-3.5 h-3.5" /> Upload a File
          </button>
        </div>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-accent font-body font-semibold">Free Scan</span>
      </div>

      {tab === "url" ? (
        <Input
          placeholder="https://example.com/suspicious-image.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={used || status === "analyzing"}
          className="bg-background/40"
        />
      ) : (
        <div
          onClick={() => !used && fileRef.current?.click()}
          className={cn(
            "border-2 border-dashed border-white/15 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors",
            used && "opacity-60 cursor-not-allowed"
          )}
        >
          <Upload className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground font-body">
            {fileName || "Click to choose an image, video, or audio file"}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*,audio/*"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      )}

      {used && status !== "analyzing" ? (
        <Button asChild className="w-full mt-3 font-body font-semibold glow-red" size="lg">
          <a href="/#pricing">
            Get Full Access <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </Button>
      ) : (
        <Button
          onClick={handleScan}
          disabled={disabled}
          className="w-full mt-3 font-body font-semibold"
          size="lg"
        >
          {status === "analyzing" ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
          ) : (
            "Scan Free"
          )}
        </Button>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground/70 font-body leading-relaxed">
        * One free scan only. <a href="/#pricing" className="underline hover:text-foreground">Join now</a> to unlock unlimited scanning and 24/7 monitoring.
      </p>

      {status === "error" && errorMsg && (
        <div className="mt-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive font-body">
          {errorMsg}
        </div>
      )}

      {(status === "authentic" || status === "manipulated") && (
        <div className="mt-4 space-y-3">
          <div className={cn(
            "rounded-lg border p-3 flex items-center gap-3",
            status === "authentic"
              ? "border-green-500/30 bg-green-500/5"
              : "border-destructive/40 bg-destructive/5"
          )}>
            {status === "authentic" ? (
              <ShieldCheck className="w-6 h-6 text-green-500 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-6 h-6 text-destructive flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className={cn(
                "font-display font-semibold text-base",
                status === "authentic" ? "text-green-500" : "text-destructive"
              )}>
                {status === "authentic" ? "Authentic" : "AI Generated"}
              </div>
              <div className="text-xs text-muted-foreground font-body">
                Confidence: {confidence}%
              </div>
            </div>
            <div className="w-20">
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={cn("h-full", status === "authentic" ? "bg-green-500" : "bg-destructive")}
                  style={{ width: `${confidence}%` }}
                />
              </div>
            </div>
          </div>

          {meta.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 mb-2 text-[11px] uppercase tracking-wider text-accent font-body font-semibold">
                <Info className="w-3 h-3" /> Origin & metadata
              </div>
              <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-xs font-body">
                {meta.map((row) => (
                  <div key={row.label} className="contents">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-foreground break-all">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
            <p className="font-display font-semibold text-foreground text-sm md:text-base mb-3">
              Protect yourself fully — monitor your likeness 24/7
            </p>
            <Button asChild size="sm" className="font-body font-semibold glow-red">
              <a href="/#pricing">
                Join Now <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroFreeScanWidget;
