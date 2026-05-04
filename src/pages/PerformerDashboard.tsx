import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardTrustFooter from "@/components/dashboard/DashboardTrustFooter";
import ProtectionScoreCard from "@/components/dashboard/ProtectionScoreCard";
import RiskScoreCard from "@/components/dashboard/RiskScoreCard";
import ProtectionJourney from "@/components/dashboard/ProtectionJourney";
import CompletedSteps, { CompletedItem } from "@/components/dashboard/CompletedSteps";
import NextSteps, { NextStep } from "@/components/dashboard/NextSteps";
import AlertsSection, { AlertItem } from "@/components/dashboard/AlertsSection";
import FacePanel from "@/components/dashboard/FacePanel";
import ProfileSummary from "@/components/dashboard/ProfileSummary";
import TakeActionList from "@/components/dashboard/TakeActionList";
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
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
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
        supabase.from("likeness_scans").select("id, query, scan_type, results, completed_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
      ]);

      setProfile(prof);
      setVerified(ver?.status === "approved");
      setHasCertificate(
        (certs && certs.length > 0) || localStorage.getItem("cmf_cert_downloaded") === "1"
      );
      setMonitoringActive(!!sub || localStorage.getItem("cmf_monitoring_basic") === "1");
      setRegistryId(certs?.[0]?.registry_id ?? assets?.[0]?.registry_id ?? null);

      const paths = [prof?.face_capture_front_url, prof?.face_capture_left_url, prof?.face_capture_right_url].filter(Boolean) as string[];
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("face-captures").createSignedUrls(paths, 60 * 10);
        setThumbs((signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[]);
      }

      const list: AlertItem[] = [];
      (scans ?? []).forEach((s: any) => {
        const results = Array.isArray(s.results) ? s.results : [];
        if (results.length > 0) {
          list.push({
            id: s.id,
            platform: s.scan_type === "image_search" ? "Image Match" : "Web Match",
            description: `We found ${results.length} potential match${results.length > 1 ? "es" : ""} related to "${s.query}".`,
            date: s.completed_at || s.created_at,
            detailsUrl: results[0]?.url,
          });
        }
      });
      setAlerts(list);
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

  const completedItems: CompletedItem[] = [
    {
      label: "Face Registered",
      detail: faceCaptured
        ? `${registryId || ""} ${profile?.face_registered_at ? "· " + new Date(profile.face_registered_at).toLocaleDateString() : ""}`.trim()
        : undefined,
      done: faceCaptured,
    },
    { label: "Identity Verified", done: verified },
    { label: "Certificate Issued", done: hasCertificate },
    { label: "Profile Complete", done: profileComplete },
  ];

  const nextSteps: NextStep[] = [];
  if (!faceCaptured) {
    nextSteps.push({
      title: "Register Your Face",
      description:
        "Capture 3 quick photos to create your timestamped, cryptographic claim of likeness.",
      cta: "Start Face Capture",
      to: "/onboarding/face-capture",
    });
  }
  if (!profileComplete) {
    nextSteps.push({
      title: "Complete Your Profile",
      description:
        "Add your stage name, union status, and performance details so your record is industry-ready.",
      cta: "Complete Profile",
      to: "/onboarding/profile",
    });
  }
  if (faceCaptured && !hasCertificate) {
    nextSteps.push({
      title: "Download Your Certificate",
      description:
        "Make your registration official. Download your Face Registration Certificate PDF.",
      cta: "Download Certificate",
      to: "/dashboard/certificate",
    });
  }
  if (!monitoringActive) {
    nextSteps.push({
      title: "Activate Monitoring",
      description:
        "Turn on 24/7 scanning across 20+ platforms. We alert you the moment we find something.",
      cta: "Activate Pro Shield",
      to: "/onboarding/monitoring",
    });
  }
  if (faceCaptured && !voiceRegistered) {
    nextSteps.push({
      title: "Add Your Voice Print",
      description:
        "Lock in your voice fingerprint — your shield against AI voice cloning. Takes 30 seconds.",
      cta: "Register Voice",
      to: "/onboarding/voice",
    });
  }
  if (faceCaptured) {
    nextSteps.push({
      title: "Share Your Verified Badge",
      description:
        "Let the industry know your face is officially registered and protected.",
      cta: "Get Your Badge",
      to: "/dashboard/certificate",
    });
  }

  const onToggleDiscoverable = async (value: boolean) => {
    if (!user) return;
    setProfile((p: any) => ({ ...p, is_discoverable: value }));
    const { error } = await supabase
      .from("profiles")
      .update({ is_discoverable: value })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Could not update", description: error.message, variant: "destructive" });
      setProfile((p: any) => ({ ...p, is_discoverable: !value }));
    } else {
      toast({ title: value ? "Profile is discoverable" : "Profile is private" });
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Hey {firstName}. Your face is claimed.
          </h1>
          <p className="text-muted-foreground mt-1">Here's your protection status.</p>
        </header>

        <RiskScoreCard
          monitoringActive={monitoringActive}
          hasCertificate={hasCertificate}
          faceCaptured={faceCaptured}
          profileComplete={profileComplete}
          voiceRegistered={voiceRegistered}
        />

        <ProtectionJourney
          registered={faceCaptured}
          certified={hasCertificate}
          monitoring={monitoringActive}
          toolsReady={profileComplete}
        />

        <ProtectionScoreCard score={score} />

        <CompletedSteps items={completedItems} />

        <div id="next-steps">
          <NextSteps steps={nextSteps} />
        </div>

        <AlertsSection alerts={alerts} />

        <FacePanel
          thumbs={thumbs}
          registryId={registryId}
          registeredAt={profile?.face_registered_at}
        />

        <ProfileSummary profile={profile} onToggleDiscoverable={onToggleDiscoverable} />

        <div id="take-action">
          <TakeActionList />
        </div>

        <DashboardTrustFooter />
      </motion.div>
    </DashboardLayout>
  );
};

export default PerformerDashboard;
