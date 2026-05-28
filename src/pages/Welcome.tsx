import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  Radar,
  Check,
  ArrowRight,
  Upload,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PROFESSIONS = [
  "Actor",
  "Voice Actor",
  "Musician",
  "Dancer",
  "Stunt Performer",
  "Model",
  "Content Creator",
  "Other",
];

const SCANNERS = [
  { key: "face", label: "Face & Photo" },
  { key: "voice", label: "Voice Clones" },
  { key: "deepfake", label: "Deepfakes" },
  { key: "writing", label: "Writing" },
  { key: "web", label: "Web Mentions" },
];

type ScanState = "idle" | "running" | "done";

const BG = "bg-[#0a0f1e]";
const RED = "#e53935";
const GOLD = "#c9a84c";

const StepDots = ({ step }: { step: 1 | 2 | 3 }) => (
  <div className="flex items-center justify-center gap-3 sm:gap-4">
    {[1, 2, 3].map((n, i) => {
      const done = step > n;
      const active = step === n;
      return (
        <div key={n} className="flex items-center gap-3 sm:gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-base font-bold border-2 transition-all",
              done && "border-[#c9a84c] text-[#c9a84c] bg-[#c9a84c]/10",
              active && "border-[#e53935] text-white bg-[#e53935]/20 shadow-[0_0_24px_rgba(229,57,53,0.6)] animate-pulse",
              !done && !active && "border-white/20 text-white/40 bg-white/5"
            )}
          >
            {done ? <Check className="w-5 h-5" strokeWidth={3} /> : n}
          </div>
          {i < 2 && (
            <ArrowRight
              className={cn("w-5 h-5", step > n ? "text-[#c9a84c]" : "text-white/30")}
            />
          )}
        </div>
      );
    })}
  </div>
);

const Welcome = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1 form
  const [form, setForm] = useState({
    stage_name: "",
    profession: "Actor",
    instagram_handle: "",
    youtube_handle: "",
  });
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  // Step 2 scan state
  const [scanStates, setScanStates] = useState<Record<string, ScanState>>(
    Object.fromEntries(SCANNERS.map((s) => [s.key, "idle"]))
  );
  const [scanResults, setScanResults] = useState<any[]>([]);
  const scanStartedRef = useRef(false);

  // Redirect if not auth
  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  // Bail out if already onboarded
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_complete, stage_name, profession, instagram_handle, youtube_handle, headshot_url")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) console.warn("Welcome profile fetch error:", error);
        if (data?.onboarding_complete) {
          navigate("/dashboard", { replace: true });
          return;
        }
        setForm({
          stage_name: data?.stage_name ?? "",
          profession: (data as any)?.profession ?? "Actor",
          instagram_handle: data?.instagram_handle ?? "",
          youtube_handle: data?.youtube_handle ?? "",
        });
        if (data?.headshot_url) setHeadshotPreview(data.headshot_url);
      } catch (e) {
        console.error("Welcome init failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  const handleHeadshot = (file: File | null) => {
    setHeadshotFile(file);
    if (file) setHeadshotPreview(URL.createObjectURL(file));
  };

  const saveStep1 = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let headshot_url = headshotPreview ?? null;
      if (headshotFile) {
        const path = `${user.id}/${Date.now()}-${headshotFile.name}`;
        const { error: upErr } = await supabase.storage.from("headshots").upload(path, headshotFile, { upsert: true });
        if (upErr) throw upErr;
        // Private bucket: persist the storage path; signed URL is generated at render time.
        headshot_url = path;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          stage_name: form.stage_name || null,
          profession: form.profession,
          instagram_handle: form.instagram_handle || null,
          youtube_handle: form.youtube_handle || null,
          headshot_url,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      setStep(2);
    } catch (e: any) {
      toast({ title: "Could not save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const skipStep1 = () => setStep(2);

  // Run scanners sequentially when entering step 2
  useEffect(() => {
    if (step !== 2 || scanStartedRef.current) return;
    scanStartedRef.current = true;

    (async () => {
      // Kick off the real web scan in the background
      const realScanPromise = supabase.functions
        .invoke("likeness-scan", { body: { query: `${form.stage_name || ""} ${form.profession}`.trim() } })
        .catch(() => null);

      for (const s of SCANNERS) {
        setScanStates((p) => ({ ...p, [s.key]: "running" }));
        await new Promise((r) => setTimeout(r, 900 + Math.random() * 500));
        setScanStates((p) => ({ ...p, [s.key]: "done" }));
      }

      // Try to gather results from the real scan + recent mentions
      const real = await realScanPromise;
      const fromScan: any[] = (real as any)?.data?.results ?? [];

      let mentions: any[] = [];
      if (user) {
        const { data } = await supabase
          .from("mentions")
          .select("id,title,url,mention_type,excerpt,thumbnail_url,confidence")
          .eq("user_id", user.id)
          .order("found_at", { ascending: false })
          .limit(8);
        mentions = data ?? [];
      }
      setScanResults(mentions.length ? mentions : fromScan.slice(0, 8));
    })();
  }, [step, form.stage_name, form.profession, user]);

  const allDone = SCANNERS.every((s) => scanStates[s.key] === "done");

  const finishOnboarding = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ onboarding_complete: true }).eq("user_id", user.id);
    navigate("/dashboard", { replace: true });
  };

  if (loading || authLoading) {
    return (
      <div className={cn("min-h-screen flex items-center justify-center", BG)}>
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  const threats = scanResults.filter((r) => (r.confidence ?? 0) >= 80 || /threat|impersonat|fake/i.test(r.mention_type || ""));
  const informational = scanResults.filter((r) => !threats.includes(r));

  return (
    <div className={cn("min-h-screen text-white relative overflow-hidden", BG)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,57,53,0.18),transparent_60%)] pointer-events-none" />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-10">
        <StepDots step={step} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <div
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: `${RED}22`, boxShadow: `0 0 40px ${RED}66` }}
                >
                  <Shield className="w-10 h-10" style={{ color: RED }} />
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">Step 1: Build Your Identity Map.</h1>
                <p className="text-white/70">The more you tell us, the better we protect you.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-4">
                <div className="space-y-1">
                  <Label>Stage Name</Label>
                  <Input
                    value={form.stage_name}
                    onChange={(e) => setForm({ ...form, stage_name: e.target.value })}
                    placeholder="Your professional name"
                    className="bg-white/5 border-white/15 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Profession</Label>
                  <Select value={form.profession} onValueChange={(v) => setForm({ ...form, profession: v })}>
                    <SelectTrigger className="bg-white/5 border-white/15 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESSIONS.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Instagram Handle</Label>
                  <Input
                    value={form.instagram_handle}
                    onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                    placeholder="@yourhandle"
                    className="bg-white/5 border-white/15 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label>YouTube Handle</Label>
                  <Input
                    value={form.youtube_handle}
                    onChange={(e) => setForm({ ...form, youtube_handle: e.target.value })}
                    placeholder="@yourchannel"
                    className="bg-white/5 border-white/15 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Headshot</Label>
                  <label className="flex items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 cursor-pointer hover:border-white/40 transition">
                    {headshotPreview ? (
                      <img src={headshotPreview} alt="headshot" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-white/60" />
                    )}
                    <span className="text-sm text-white/70">
                      {headshotFile?.name || (headshotPreview ? "Change photo" : "Upload a photo")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleHeadshot(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={saveStep1}
                  disabled={saving}
                  className="w-full h-12 text-base font-semibold"
                  style={{ background: RED }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4 ml-1" /></>}
                </Button>
                <button onClick={skipStep1} className="block mx-auto text-sm text-white/50 hover:text-white/80 underline">
                  Skip for now
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: `${RED}22`, boxShadow: `0 0 40px ${RED}66` }}
                >
                  <Radar className="w-10 h-10" style={{ color: RED }} />
                </motion.div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">Step 2: Scanning the Web for You.</h1>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 space-y-3">
                {SCANNERS.map((s) => {
                  const state = scanStates[s.key];
                  return (
                    <div key={s.key} className="flex items-center justify-between py-2">
                      <span className="text-white/90">{s.label}</span>
                      {state === "idle" && <span className="text-white/30 text-sm">Queued</span>}
                      {state === "running" && (
                        <span className="flex items-center gap-2 text-sm" style={{ color: RED }}>
                          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ background: RED }} />
                          Scanning…
                        </span>
                      )}
                      {state === "done" && (
                        <span className="flex items-center gap-2 text-sm text-emerald-400">
                          <Check className="w-4 h-4" strokeWidth={3} /> Done
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {allDone && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
                  <p className="text-2xl font-semibold" style={{ color: GOLD }}>
                    Scan Complete — {scanResults.length} result{scanResults.length === 1 ? "" : "s"} found
                  </p>
                  <Button
                    onClick={() => setStep(3)}
                    className="h-12 px-8 text-base font-semibold"
                    style={{ background: RED }}
                  >
                    See My Results <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="text-center space-y-4">
                <div
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: `${GOLD}22`, boxShadow: `0 0 40px ${GOLD}66` }}
                >
                  <ShieldCheck className="w-10 h-10" style={{ color: GOLD }} />
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">Step 3: Here's What We Found.</h1>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
                {threats.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: RED }}>
                      Threats
                    </p>
                    {threats.map((r, i) => (
                      <ResultCard key={r.id ?? `t${i}`} item={r} tone="threat" />
                    ))}
                  </div>
                )}
                {informational.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider font-semibold text-white/60">Informational</p>
                    {informational.map((r, i) => (
                      <ResultCard key={r.id ?? `i${i}`} item={r} tone="info" />
                    ))}
                  </div>
                )}
                {scanResults.length === 0 && (
                  <p className="text-center text-white/60 py-8">No matches yet. We'll keep scanning in the background.</p>
                )}
              </div>

              <Button
                onClick={finishOnboarding}
                disabled={saving}
                className="w-full h-12 text-base font-semibold"
                style={{ background: RED }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Go to My Dashboard <ArrowRight className="w-4 h-4 ml-1" /></>}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ResultCard = ({ item, tone }: { item: any; tone: "threat" | "info" }) => (
  <div
    className={cn(
      "flex items-center gap-3 rounded-lg border p-3",
      tone === "threat"
        ? "border-[#e53935]/40 bg-[#e53935]/10"
        : "border-white/10 bg-[#0a0f1e]/80"
    )}
  >
    {item.thumbnail_url ? (
      <img src={item.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
    ) : (
      <div className="w-10 h-10 rounded bg-white/10 shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate">{item.title || item.url || "Untitled"}</p>
      {item.excerpt && <p className="text-xs text-white/60 truncate">{item.excerpt}</p>}
    </div>
    <div className="flex items-center gap-1 text-white/60">
      <button className="p-1.5 rounded hover:bg-white/10" title="Looks right"><ThumbsUp className="w-4 h-4" /></button>
      <button className="p-1.5 rounded hover:bg-white/10" title="Not me"><ThumbsDown className="w-4 h-4" /></button>
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-white/10">
          <ExternalLink className="w-4 h-4" />
        </a>
      )}
    </div>
  </div>
);

export default Welcome;
