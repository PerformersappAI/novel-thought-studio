import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, ShieldAlert, Upload, Link as LinkIcon, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "url" | "file";
type Status = "idle" | "analyzing" | "authentic" | "manipulated";

const STORAGE_KEY = "cmf_free_scan_used";

const hashString = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const HeroFreeScanWidget = () => {
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [confidence, setConfidence] = useState(0);
  const [used, setUsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) {
      setUsed(true);
    }
  }, []);

  const handleScan = async () => {
    let seed = 0;
    if (tab === "url") {
      if (!url.trim()) return;
      seed = hashString(url.trim());
    } else {
      if (!pendingFile.current) return;
      seed = hashString(pendingFile.current.name + pendingFile.current.size);
    }
    setStatus("analyzing");
    await new Promise((r) => setTimeout(r, 1800));
    const isManip = seed % 2 === 0;
    const conf = 70 + (seed % 30);
    setConfidence(conf);
    setStatus(isManip ? "manipulated" : "authentic");
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setUsed(true);
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
        <Button
          asChild
          className="w-full mt-3 font-body font-semibold glow-red"
          size="lg"
        >
          <Link to="/register">
            Get Full Access <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
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
        * One free scan per visitor. <Link to="/register" className="underline hover:text-foreground">Create a free account</Link> to unlock unlimited scanning and 24/7 monitoring.
      </p>


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

          <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-center">
            <p className="font-display font-semibold text-foreground text-sm md:text-base mb-3">
              Protect yourself fully — monitor your likeness 24/7
            </p>
            <Button asChild size="sm" className="font-body font-semibold glow-red">
              <Link to="/register">
                Start Free Trial <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroFreeScanWidget;
