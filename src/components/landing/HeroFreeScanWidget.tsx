import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ShieldCheck, ShieldAlert, Upload, Image as ImageIcon, Video, ArrowRight, Info, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import exifr from "exifr";

type Mode = "photo" | "video";
type Status = "idle" | "analyzing" | "authentic" | "manipulated" | "error";

interface MetaRow { label: string; value: string }

const VIDEO_HOSTS = [
  "youtube.com", "youtu.be", "tiktok.com", "vimeo.com",
  "dailymotion.com", "twitch.tv", "fb.watch",
];

const isVideoPlatformUrl = (raw: string) => {
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    return VIDEO_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
};

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
  ];
  if (file.type.startsWith("image/")) {
    try {
      const exif: any = await exifr.parse(file, true);
      if (exif) {
        if (exif.Make || exif.Model) rows.push({ label: "Camera", value: `${exif.Make ?? ""} ${exif.Model ?? ""}`.trim() });
        if (exif.Software) rows.push({ label: "Software", value: String(exif.Software) });
        if (exif.DateTimeOriginal) rows.push({ label: "Captured", value: new Date(exif.DateTimeOriginal).toLocaleString() });
      }
    } catch { /* ignore */ }
  }
  return rows;
};

const HeroFreeScanWidget = () => {
  const [mode, setMode] = useState<Mode>("photo");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [confidence, setConfidence] = useState(0);
  const [meta, setMeta] = useState<MetaRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  // Auto-switch to video mode if a video platform URL is pasted
  useEffect(() => {
    if (url && isVideoPlatformUrl(url)) {
      setMode("video");
    }
  }, [url]);

  const handleScan = async () => {
    setStatus("analyzing");
    setErrorMsg(null);
    setMeta([]);
    try {
      let metaRows: MetaRow[] = [];
      let invokeBody: Record<string, unknown> = {};

      if (mode === "photo" && url.trim() && !pendingFile.current) {
        if (isVideoPlatformUrl(url.trim())) {
          setMode("video");
          setStatus("idle");
          return;
        }
        metaRows = extractUrlMeta(url.trim());
        invokeBody = { url: url.trim() };
      } else if (pendingFile.current) {
        metaRows = await extractFileMeta(pendingFile.current);
        const fileBase64 = await fileToBase64(pendingFile.current);
        invokeBody = {
          fileBase64,
          fileName: pendingFile.current.name,
          mimeType: pendingFile.current.type,
        };
      } else {
        setStatus("idle");
        return;
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

  const canScan = mode === "photo"
    ? (!!url.trim() && !isVideoPlatformUrl(url.trim())) || !!fileName
    : !!fileName;

  return (
    <div className="mt-6 rounded-2xl glass-card p-4 md:p-5 w-full max-w-xl mx-auto md:mx-0">
      {/* Mode selector — two distinct options */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setMode("photo")}
          className={cn(
            "rounded-lg border p-3 text-left transition-all",
            mode === "photo"
              ? "border-primary bg-primary/10 ring-1 ring-primary/40"
              : "border-white/10 bg-white/[0.03] hover:border-white/20"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <ImageIcon className={cn("w-4 h-4", mode === "photo" ? "text-primary" : "text-muted-foreground")} />
            <span className="font-display font-semibold text-sm">Scan a Photo</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-body leading-snug">
            Upload an image or paste a direct image URL
          </p>
        </button>
        <button
          onClick={() => setMode("video")}
          className={cn(
            "rounded-lg border p-3 text-left transition-all",
            mode === "video"
              ? "border-accent bg-accent/10 ring-1 ring-accent/40"
              : "border-white/10 bg-white/[0.03] hover:border-white/20"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Video className={cn("w-4 h-4", mode === "video" ? "text-accent" : "text-muted-foreground")} />
            <span className="font-display font-semibold text-sm">Scan a Video</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-body leading-snug">
            Upload a screenshot from the video
          </p>
        </button>
      </div>

      {mode === "photo" ? (
        <div className="space-y-2">
          <Input
            placeholder="https://example.com/suspicious-image.jpg"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={status === "analyzing"}
            className="bg-background/40"
          />
          <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/60 font-body">or</div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-body">
              {fileName || "Upload an image file"}
            </p>
          </div>
          {url && isVideoPlatformUrl(url) && (
            <div className="rounded-lg border border-accent/40 bg-accent/5 p-3 text-xs font-body text-accent flex gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>That's a video link — switched to <strong>Scan a Video</strong>.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs font-body text-foreground/90 flex gap-2">
            <Camera className="w-4 h-4 flex-shrink-0 mt-0.5 text-accent" />
            <span>
              To scan a video for deepfakes, take a screenshot from the video and upload it here.
              We'll analyze the image for signs of AI manipulation.
            </span>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition-colors"
          >
            <Upload className="w-5 h-5 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-body">
              {fileName || "Upload a screenshot from the video"}
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      <Button
        onClick={handleScan}
        disabled={!canScan || status === "analyzing"}
        className="w-full mt-3 font-body font-semibold"
        size="lg"
      >
        {status === "analyzing" ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
        ) : (
          "Scan Free"
        )}
      </Button>

      <p className="mt-2 text-[11px] text-muted-foreground/70 font-body leading-relaxed">
        * Free & unlimited preview. <a href="/#pricing" className="underline hover:text-foreground">Join now</a> for 24/7 monitoring and takedown tools.
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
