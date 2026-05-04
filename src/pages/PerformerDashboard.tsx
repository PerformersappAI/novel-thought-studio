import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, AlertTriangle, CheckCircle2, ScanSearch } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ProtectionScoreCard from "@/components/dashboard/ProtectionScoreCard";
import RiskScoreCard from "@/components/dashboard/RiskScoreCard";
import FacePanel from "@/components/dashboard/FacePanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PerformerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [registryId, setRegistryId] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [externalRiskScore, setExternalRiskScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [
        { data: prof },
        { data: ver },
        { data: certs },
        { data: sub },
        { data: assets },
        { data: scans },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
        supabase.from("identity_verifications").select("status").eq("user_id", user.id).maybeSingle(),
        supabase.from("certificates").select("id, registry_id").eq("user_id", user.id).limit(1),
        supabase.from("user_subscriptions").select("status").eq("user_id", user.id).eq("status", "active").maybeSingle(),
        supabase.from("registry_assets").select("registry_id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1),
        supabase.from("likeness_scans").select("id, results").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      setProfile(prof);
      setVerified(ver?.status === "approved");
      setHasCertificate(
        (certs && certs.length > 0) || localStorage.getItem("cmf_cert_downloaded") === "1"
      );
      setMonitoringActive(!!sub || localStorage.getItem("cmf_monitoring_basic") === "1");
      setRegistryId(certs?.[0]?.registry_id ?? assets?.[0]?.registry_id ?? null);

      // Count total matches across scans
      let matches = 0;
      (scans ?? []).forEach((s: any) => {
        const results = Array.isArray(s.results) ? s.results : [];
        matches += results.length;
      });
      setAlertCount(matches);

      const paths = [prof?.face_capture_front_url, prof?.face_capture_left_url, prof?.face_capture_right_url].filter(Boolean) as string[];
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("face-captures").createSignedUrls(paths, 60 * 10);
        setThumbs((signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[]);
      }

      // Fetch external actor risk score
      if ((prof as any)?.external_actor_id) {
        try {
          const { data: actorData } = await supabase.functions.invoke(
            "actor-registry?action=get_actor&actor_id=" + (prof as any).external_actor_id,
            { method: "GET" }
          );
          if (actorData?.risk_score != null) {
            setExternalRiskScore(actorData.risk_score);
          }
        } catch (e) {
          console.warn("Failed to fetch external actor profile:", e);
        }
      }
    })();
  }, [user]);

  const profileComplete = !!(
    profile?.legal_name &&
    profile?.stage_name &&
    profile?.phone &&
    profile?.performance_type
  );
  const faceCaptured = !!profile?.face_registered_at;
  const voiceRegistered = !!profile?.voice_registered_at;

  let score = 0;
  if (profileComplete) score += 25;
  if (faceCaptured) score += 25;
  if (hasCertificate) score += 20;
  if (monitoringActive) score += 30;

  const firstName =
    (profile?.stage_name || profile?.legal_name || profile?.full_name || user?.email || "there")
      .split(" ")[0]
      .replace(/@.*/, "");

  // Determine the single most important next step
  const getNextStep = () => {
    if (!faceCaptured) {
      return {
        title: "Register Your Face",
        description: "Capture 3 quick photos to create your timestamped claim of likeness. It's free and takes 2 minutes.",
        cta: "Start Face Capture",
        to: "/onboarding/face-capture",
      };
    }
    if (!profileComplete) {
      return {
        title: "Complete Your Profile",
        description: "Add your stage name, union status, and performance details so your record is industry-ready.",
        cta: "Complete Profile",
        to: "/onboarding/profile",
      };
    }
    if (!hasCertificate) {
      return {
        title: "Download Your Certificate",
        description: "Your face is registered. Download your official Face Registration Certificate to make it official.",
        cta: "Get Certificate",
        to: "/dashboard/certificate",
      };
    }
    if (!monitoringActive) {
      return {
        title: "Activate Monitoring",
        description: "Turn on 24/7 scanning so we can alert you the moment your face appears somewhere it shouldn't.",
        cta: "Activate Monitoring",
        to: "/onboarding/monitoring",
      };
    }
    if (alertCount > 0) {
      return {
        title: "Review Your Matches",
        description: `We found ${alertCount} potential match${alertCount > 1 ? "es" : ""}. Review them and decide what to do.`,
        cta: "View Scan Results",
        to: "/dashboard/monitoring",
      };
    }
    return null; // Everything is done
  };

  const nextStep = getNextStep();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        {/* Header */}
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Hey {firstName}. {faceCaptured ? "Your face is claimed." : "Let's protect your face."}
          </h1>
          <p className="text-muted-foreground mt-1">Here's your protection status at a glance.</p>
        </header>

        {/* 1. Protection Score */}
        <ProtectionScoreCard score={score} />

        {/* 2. Your Face */}
        <FacePanel
          thumbs={thumbs}
          registryId={registryId}
          registeredAt={profile?.face_registered_at}
        />

        {/* 3. What We Found */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border/30 bg-card/40 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <ScanSearch className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">What We Found</h2>
          </div>
          {alertCount > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {alertCount} potential match{alertCount > 1 ? "es" : ""} found
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We detected possible unauthorized use of your likeness.
                  </p>
                </div>
                <Button asChild size="sm" variant="destructive">
                  <Link to="/dashboard/monitoring">
                    Review <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ) : monitoringActive ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">You're clean</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No unauthorized use detected. We're watching 24/7 and will alert you if anything shows up.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/20">
              <Shield className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Monitoring not active</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Activate monitoring to scan for unauthorized use of your face across the web.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* 4. Single Next Step */}
        {nextStep && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-6"
          >
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">
              Your Next Step
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              {nextStep.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {nextStep.description}
            </p>
            <Button asChild size="lg" className="glow-red">
              <Link to={nextStep.to}>
                {nextStep.cta}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        )}

        {/* All done state */}
        {!nextStep && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="font-display text-xl font-bold text-foreground mb-1">
              You're fully protected
            </h3>
            <p className="text-sm text-muted-foreground">
              Your face is registered, certified, and monitored 24/7. We'll notify you if anything comes up.
            </p>
          </motion.div>
        )}

        {/* Risk Score (secondary) */}
        <RiskScoreCard
          monitoringActive={monitoringActive}
          hasCertificate={hasCertificate}
          faceCaptured={faceCaptured}
          profileComplete={profileComplete}
          voiceRegistered={voiceRegistered}
          externalRiskScore={externalRiskScore}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default PerformerDashboard;
