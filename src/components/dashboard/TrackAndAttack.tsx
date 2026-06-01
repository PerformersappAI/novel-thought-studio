import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Link2, Upload, Save, Trash2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  type?: string;
  deepfake?: { verdict?: string; fake_score?: number; real_score?: number };
  domain_info?: { domain?: string; ip?: string; registrar?: string; created?: string };
  exif?: Record<string, any>;
  page_title?: string;
  note?: string;
  [k: string]: any;
}

interface EvidenceEntry {
  id: string;
  source: string;
  source_type: string;
  verdict: string | null;
  note: string | null;
  created_at: string;
}

const TrackAndAttack = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [currentSource, setCurrentSource] = useState<{ value: string; type: "url" | "upload" } | null>(null);
  const [entries, setEntries] = useState<EvidenceEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const loadEntries = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("evidence_log" as any)
      .select("id, source, source_type, verdict, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setEntries((data as any) || []);
  };

  useEffect(() => { loadEntries(); }, [user]);

  const analyzeUrl = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setCurrentSource({ value: url.trim(), type: "url" });
    try {
      const resp = await fetch("https://api.claimmyface.com/build-case-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
      setResult(data);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const analyzeUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setCurrentSource({ value: file.name, type: "upload" });
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch("https://api.claimmyface.com/build-case-file-upload", {
        method: "POST",
        body: fd,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || `HTTP ${resp.status}`);
      setResult(data);
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveToLog = async () => {
    if (!user || !result || !currentSource) return;
    setSaving(true);
    const verdict = result.deepfake?.verdict || (result.type ? "analyzed" : "unknown");
    const { error } = await supabase.from("evidence_log" as any).insert({
      user_id: user.id,
      source: currentSource.value,
      source_type: currentSource.type,
      verdict,
      note: result.note || null,
      analysis: result as any,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Couldn't save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved to Evidence Log" });
    loadEntries();
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("evidence_log" as any).delete().eq("id", id);
    if (error) { toast({ title: "Failed to delete", variant: "destructive" }); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const df = result?.deepfake;
  const fakePct = df?.fake_score != null ? Math.round((df.fake_score <= 1 ? df.fake_score * 100 : df.fake_score)) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-2xl border border-border/30 bg-card/40 p-6 space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Track &amp; Attack</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Found something suspicious? Drop it here. We'll analyze it and add it to your evidence log.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* URL */}
        <div className="rounded-xl border border-border/30 bg-background/40 p-4 space-y-3">
          <Label className="flex items-center gap-2 text-sm">
            <Link2 className="w-4 h-4 text-primary" /> Paste an image link or social media URL
          </Label>
          <Input
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <Button
            onClick={analyzeUrl}
            disabled={!url.trim() || loading}
            className="w-full"
          >
            {loading && currentSource?.type === "url" ? "Analyzing…" : "Analyze URL"}
          </Button>
        </div>

        {/* Upload */}
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
          <Button
            onClick={analyzeUpload}
            disabled={!file || loading}
            className="w-full"
          >
            {loading && currentSource?.type === "upload" ? "Analyzing…" : "Analyze Upload"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-border/30 bg-secondary/30 p-4 text-sm text-muted-foreground text-center">
          Analyzing… this can take up to 15 seconds.
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* Verdict banner */}
          {df?.verdict === "likely_fake" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-destructive">
                ⚠️ Likely Manipulated — {fakePct}% confidence this may be AI-generated or altered
              </p>
            </div>
          )}
          {df?.verdict === "likely_real" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-emerald-500">
                ✓ No strong signs of manipulation detected
              </p>
            </div>
          )}
          {!df && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border/40">
              <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-muted-foreground">
                Social link — limited analysis available
              </p>
            </div>
          )}

          {/* Domain info */}
          {result.domain_info && Object.keys(result.domain_info).length > 0 && (
            <div className="rounded-xl border border-border/30 bg-background/40 p-4">
              <h3 className="text-sm font-semibold mb-2">Where it's hosted</h3>
              <dl className="text-xs space-y-1">
                {(["domain", "ip", "registrar", "created"] as const).map(k => result.domain_info?.[k] ? (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted-foreground capitalize">{k}</dt>
                    <dd className="text-foreground break-all text-right">{String(result.domain_info?.[k])}</dd>
                  </div>
                ) : null)}
              </dl>
            </div>
          )}

          {/* EXIF */}
          {result.exif !== undefined && (
            <div className="rounded-xl border border-border/30 bg-background/40 p-4">
              <h3 className="text-sm font-semibold mb-2">Hidden image data (EXIF)</h3>
              {result.exif && Object.keys(result.exif).length > 0 ? (
                <dl className="text-xs space-y-1">
                  {Object.entries(result.exif).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-foreground break-all text-right">{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-xs text-muted-foreground">No embedded metadata found (common for AI-generated or stripped images)</p>
              )}
            </div>
          )}

          {result.note && (
            <p className="text-xs text-muted-foreground">{result.note}</p>
          )}

          <Button onClick={saveToLog} disabled={saving} variant="outline" className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save to Evidence Log"}
          </Button>
        </div>
      )}

      {/* Evidence log */}
      <div className="pt-2 border-t border-border/30">
        <h3 className="font-display text-base font-semibold mb-3">Your Evidence Log</h3>
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">No saved entries yet. Analyze something above and click "Save to Evidence Log."</p>
        ) : (
          <ul className="space-y-2">
            {entries.map(e => (
              <li key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-border/30 bg-background/40 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{e.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()} · <span className="capitalize">{e.verdict || "—"}</span>
                  </p>
                  {e.note && <p className="text-xs text-muted-foreground mt-1">{e.note}</p>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteEntry(e.id)} aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-2 border-t border-border/30">
        ClaimMyFace provides analysis and documentation tools. Results are AI estimates, not proof of anything. Nothing here is legal advice.
      </p>
    </motion.section>
  );
};

export default TrackAndAttack;
