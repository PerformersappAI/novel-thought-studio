import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle, Radar, Download, ShieldAlert } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type ScannerStatus = "idle" | "running" | "clean" | "threat";

interface Scanner {
  key: string;
  label: string;
  status: ScannerStatus;
  threatDescription?: string;
}

const INITIAL_SCANNERS: Scanner[] = [
  { key: "face", label: "Scanning Face & Photo Matches", status: "idle" },
  { key: "voice", label: "Checking Voice Clones", status: "idle" },
  { key: "deepfake", label: "Deepfake Detection", status: "idle" },
  { key: "plagiarism", label: "Writing & Plagiarism Check", status: "idle" },
  { key: "risk", label: "Calculating Risk Score", status: "idle" },
];

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const PerformerDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [scanners, setScanners] = useState<Scanner[]>(INITIAL_SCANNERS);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const firstName = (profile?.stage_name || profile?.legal_name || profile?.full_name || user?.email || "there")
    .split(" ")[0].replace(/@.*/, "");

  const runFullScan = async () => {
    setPhase("scanning");
    setScanners(INITIAL_SCANNERS.map(s => ({ ...s, status: "idle", threatDescription: undefined })));

    for (let i = 0; i < INITIAL_SCANNERS.length; i++) {
      // mark running
      setScanners(prev => prev.map((s, idx) => idx === i ? { ...s, status: "running" } : s));
      await wait(1400 + Math.random() * 800);

      // simulate result — deepfake flags as threat for demo realism, others clean
      const isThreat = INITIAL_SCANNERS[i].key === "deepfake";
      setScanners(prev => prev.map((s, idx) => idx === i ? {
        ...s,
        status: isThreat ? "threat" : "clean",
        threatDescription: isThreat
          ? "1 suspected deepfake video found referencing your likeness. Review recommended."
          : undefined,
      } : s));
      await wait(350);
    }

    setPhase("done");
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10">
        {/* 1. Header */}
        <header className="text-center pt-4 pb-2">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">Mission Control</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-8">
            {firstName}
          </h1>
          <Button
            size="lg"
            onClick={runFullScan}
            disabled={phase === "scanning"}
            className="h-16 px-12 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 glow-red shadow-2xl"
          >
            <Radar className="w-5 h-5 mr-2" />
            {phase === "scanning" ? "Running Full Scan..." : phase === "done" ? "Run Full Scan Again" : "Run Full Scan"}
          </Button>
        </header>

        {/* 2. Live Scan Activity Panel */}
        <AnimatePresence>
          {phase !== "idle" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-primary/30 bg-card/60 backdrop-blur-xl p-6 md:p-8"
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                </span>
                <h2 className="font-display text-lg font-semibold uppercase tracking-widest">Live Scan Activity</h2>
              </div>

              <ul className="space-y-3">
                {scanners.map((s) => (
                  <motion.li
                    key={s.key}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: s.status === "idle" ? 0.4 : 1 }}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/30 bg-background/40"
                  >
                    <div className="w-8 h-8 flex items-center justify-center shrink-0">
                      {s.status === "idle" && <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />}
                      {s.status === "running" && <Loader2 className="w-6 h-6 text-primary animate-spin" />}
                      {s.status === "clean" && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                      {s.status === "threat" && <AlertTriangle className="w-6 h-6 text-destructive" />}
                    </div>
                    <span className="flex-1 font-mono text-sm md:text-base">
                      {s.label}
                      {s.status === "running" && <span className="text-primary animate-pulse">...</span>}
                    </span>
                    <span className="text-xs uppercase tracking-wider font-semibold">
                      {s.status === "idle" && <span className="text-muted-foreground/60">Queued</span>}
                      {s.status === "running" && <span className="text-primary">Scanning</span>}
                      {s.status === "clean" && <span className="text-emerald-500">Clean</span>}
                      {s.status === "threat" && <span className="text-destructive">Alert</span>}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.section>
          )}
        </AnimatePresence>

        {/* 3. Your Results */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="font-display text-2xl font-bold">Your Results</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {scanners.map((s) => {
                  const isThreat = s.status === "threat";
                  return (
                    <div
                      key={s.key}
                      className={`rounded-2xl border p-5 ${
                        isThreat
                          ? "border-destructive/40 bg-destructive/10"
                          : "border-emerald-500/30 bg-emerald-500/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isThreat ? (
                          <ShieldAlert className="w-5 h-5 text-destructive" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                        <h3 className="font-semibold">{s.label.replace(/^Scanning |^Checking |^Calculating /, "")}</h3>
                      </div>
                      <p className={`text-sm ${isThreat ? "text-destructive-foreground/90" : "text-muted-foreground"}`}>
                        {isThreat
                          ? s.threatDescription
                          : "No threats detected. You're clean."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* 4. Your Certificate */}
        <AnimatePresence>
          {phase === "done" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-accent/30 bg-card/40 p-8 text-center"
            >
              <h2 className="font-display text-2xl font-bold mb-2">Your Certificate</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your timestamped Face Registration Certificate is ready.
              </p>
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 glow-gold">
                <Link to="/dashboard/certificate">
                  <Download className="w-5 h-5 mr-2" />
                  Download My Face Certificate
                </Link>
              </Button>
            </motion.section>
          )}
        </AnimatePresence>
      </motion.div>
    </DashboardLayout>
  );
};

export default PerformerDashboard;
