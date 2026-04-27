import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Check, Download, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import TrustBanner from "@/components/onboarding/TrustBanner";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

const OnboardingComplete = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tier = params.get("tier") === "pro" ? "Pro Shield" : "Basic";
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [registryId, setRegistryId] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);

      // Signed URLs for the 3 captures
      const paths = [data?.face_capture_front_url, data?.face_capture_left_url, data?.face_capture_right_url].filter(Boolean) as string[];
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("face-captures").createSignedUrls(paths, 60 * 10);
        setThumbs((signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[]);
      }

      const year = new Date().getFullYear();
      const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
      setRegistryId(`CMF-${year}-${suffix}`);
      setLoading(false);
    })();
  }, [user]);

  const descriptorPreview = (() => {
    const d = profile?.face_descriptor as number[] | undefined;
    if (!d || !Array.isArray(d)) return "[ pending ]";
    return "[" + d.slice(0, 6).map((n) => n.toFixed(2)).join(", ") + "…]";
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-[140px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-6">
        <OnboardingProgress step={4} done />
        <TrustBanner />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-10 text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto w-24 h-24 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center glow-red"
          >
            <Shield className="w-12 h-12 text-primary" />
            <Check className="w-6 h-6 text-primary absolute" strokeWidth={3} />
          </motion.div>

          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-gradient-crimson">
              Your Face Is Now Claimed.
            </h1>
            <p className="text-lg text-muted-foreground mt-2">You are protected.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="rounded-lg border border-border/60 bg-card/40 p-3">
              <p className="text-xs text-muted-foreground">Registry ID</p>
              <p className="font-mono text-sm font-semibold">{registryId}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/40 p-3">
              <p className="text-xs text-muted-foreground">Registered</p>
              <p className="font-mono text-sm">{profile?.face_registered_at ? new Date(profile.face_registered_at).toLocaleString() : new Date().toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">Protection level</p>
              <p className="text-sm font-semibold text-primary">{tier}</p>
            </div>
          </div>

          {thumbs.length > 0 && (
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              {thumbs.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/20">
                  <img src={url} alt={`capture ${i}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg border border-border/60 bg-card/40 p-3 max-w-md mx-auto text-left">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Face Hash</p>
            <p className="font-mono text-xs break-all">{descriptorPreview}</p>
          </div>

          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Your face has been registered, encrypted, and timestamped in the ClaimMyFace secure registry.
            This is your legal baseline. Your data belongs to you — and only you.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              "🔒 AES-256 Encrypted",
              "🛡️ SOC 2 Compliant Storage",
              "✓ Never Sold or Shared",
            ].map((b) => (
              <span
                key={b}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-foreground/90"
              >
                {b}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2 max-w-md mx-auto">
            <Button asChild size="lg" className="font-display w-full">
              <Link to="/dashboard">
                Go to My Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link to="/dashboard/certificate">
                <Download className="w-4 h-4 mr-1" /> Download Certificate
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingComplete;
