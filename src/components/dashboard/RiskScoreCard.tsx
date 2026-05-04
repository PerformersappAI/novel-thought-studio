import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  monitoringActive: boolean;
  hasCertificate: boolean;
  faceCaptured: boolean;
  profileComplete: boolean;
  voiceRegistered?: boolean;
  externalRiskScore?: number | null;
}

const RiskScoreCard = ({ monitoringActive, hasCertificate, faceCaptured, profileComplete, voiceRegistered = false, externalRiskScore }: Props) => {
  // Use external risk score if available, otherwise compute locally
  let risk: number;
  if (externalRiskScore != null) {
    risk = Math.max(0, Math.min(100, externalRiskScore));
  } else {
    risk = 0;
    if (!monitoringActive) risk += 35;
    if (!hasCertificate) risk += 20;
    if (!faceCaptured) risk += 25;
    if (!profileComplete) risk += 12;
    if (!voiceRegistered) risk += 8;
  }

  const level = risk >= 70 ? "high" : risk >= 40 ? "medium" : "low";

  const config = {
    high: {
      label: "HIGH RISK",
      sub: "Your face is unprotected. Take action now.",
      borderClass: "border-l-[hsl(var(--crimson))]",
      ringColor: "hsl(var(--crimson))",
      textColor: "text-[hsl(var(--crimson-bright))]",
      cta: "Protect My Face Now",
      ctaTo: "/onboarding/monitoring",
      ctaVariant: "filled" as const,
      Icon: ShieldAlert,
    },
    medium: {
      label: "MEDIUM RISK",
      sub: "You have basic protection. Monitoring recommended.",
      borderClass: "border-l-[hsl(var(--gold))]",
      ringColor: "hsl(var(--gold))",
      textColor: "text-[hsl(var(--gold))]",
      cta: "Upgrade Protection",
      ctaTo: "/onboarding/monitoring",
      ctaVariant: "filled" as const,
      Icon: ShieldQuestion,
    },
    low: {
      label: "LOW RISK",
      sub: "Strong protection active. We're watching.",
      borderClass: "border-l-emerald-500",
      ringColor: "rgb(16 185 129)",
      textColor: "text-emerald-400",
      cta: "View My Protection Details",
      ctaTo: "/dashboard/monitoring",
      ctaVariant: "outline" as const,
      Icon: ShieldCheck,
    },
  }[level];

  let priority = "You're fully protected. Share your verified badge.";
  if (!monitoringActive) priority = "Activate Pro Shield monitoring — your face is being scanned without protection";
  else if (!hasCertificate) priority = "Download your certificate — establish your legal timestamp today";
  else if (!faceCaptured) priority = "Complete face capture — your registration is incomplete";
  else if (!profileComplete) priority = "Complete your profile — required for full protection";
  else if (!voiceRegistered) priority = "Add your voice print — protect against AI voice cloning";

  const radius = 46;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (risk / 100) * circ;

  return (
    <div className="space-y-3">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative rounded-2xl border border-border/40 bg-card/60 backdrop-blur p-6 md:p-7 border-l-[6px]",
          config.borderClass
        )}
      >
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 mb-2">
              <config.Icon className={cn("w-5 h-5", config.textColor)} />
              <span className={cn("font-display font-extrabold tracking-wider text-2xl md:text-3xl", config.textColor)}>
                {config.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{config.sub}</p>
            <p className="text-sm text-foreground/90 font-medium leading-snug">
              <span className={config.textColor}>→</span> {priority}
            </p>
          </div>

          <div className="relative w-[120px] h-[120px] shrink-0">
            <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
              <circle cx="55" cy="55" r={radius} stroke="hsl(var(--border))" strokeWidth="8" fill="none" opacity={0.3} />
              <motion.circle
                cx="55"
                cy="55"
                r={radius}
                stroke={config.ringColor}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circ}
                initial={{ strokeDashoffset: circ }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("font-display text-3xl font-extrabold leading-none", config.textColor)}>{risk}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Risk Score</span>
              {externalRiskScore != null && (
                <span className="text-[8px] uppercase tracking-wider text-muted-foreground/60 mt-0.5">Live API</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div>
        {config.ctaVariant === "filled" ? (
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
            <Link to={config.ctaTo}>
              {config.cta} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link to={config.ctaTo}>
              {config.cta} <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default RiskScoreCard;
