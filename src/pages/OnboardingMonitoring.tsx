import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Shield,
  Music2,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Linkedin,
  Image as ImageIcon,
  Search,
  ShoppingBag,
  Megaphone,
  Briefcase,
  Newspaper,
  AlertTriangle,
  Store,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import TrustBanner from "@/components/onboarding/TrustBanner";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import OnboardingBackButton from "@/components/onboarding/OnboardingBackButton";
import { useAuth } from "@/hooks/useAuth";

const SOCIAL = [
  { name: "TikTok", Icon: Music2 },
  { name: "Instagram", Icon: Instagram },
  { name: "Facebook", Icon: Facebook },
  { name: "YouTube", Icon: Youtube },
  { name: "X / Twitter", Icon: Twitter },
  { name: "LinkedIn", Icon: Linkedin },
];
const WEB = [
  { name: "Google Images", Icon: Search },
  { name: "Bing Images", Icon: ImageIcon },
  { name: "Stock Sites", Icon: ShoppingBag },
  { name: "Ad Networks", Icon: Megaphone },
];
const INDUSTRY = [
  { name: "Casting Platforms", Icon: Briefcase },
  { name: "News & Articles", Icon: Newspaper },
  { name: "Deepfake Databases", Icon: AlertTriangle },
  { name: "Fiverr", Icon: Store },
];

const Tile = ({ name, Icon }: { name: string; Icon: any }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-3 hover:border-primary/40 transition-colors">
    <Icon className="w-5 h-5 text-primary" />
    <p className="text-[11px] font-medium text-center leading-tight">{name}</p>
  </div>
);

const VALID_PROMO_CODES = ["CLAIMVIP", "PROSHIELD2026", "SALFREE"];

const OnboardingMonitoring = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoError, setPromoError] = useState("");

  const continueBasic = () => navigate("/onboarding/complete?tier=basic");
  const activatePro = () => navigate("/pricing?tier=pro&from=onboarding");

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (VALID_PROMO_CODES.includes(code)) {
      navigate("/onboarding/complete?tier=pro&promo=" + code);
    } else {
      setPromoError("Invalid promo code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 space-y-6">
        <OnboardingBackButton to="/onboarding/certified" label="Back to Certificate" />
        <OnboardingProgress step={5} />
        <TrustBanner />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <header className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">
              Step 4 of 4 — Turn On Monitoring
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
              The last step. This is where your protection goes live.
            </h1>
          </header>

          {/* Coverage grid */}
          <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Social</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {SOCIAL.map((p) => <Tile key={p.name} {...p} />)}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Web</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WEB.map((p) => <Tile key={p.name} {...p} />)}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Industry</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {INDUSTRY.map((p) => <Tile key={p.name} {...p} />)}
              </div>
            </div>
          </div>

          {/* Plan cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Basic */}
            <div className="rounded-2xl border border-border bg-card/40 p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Basic Protection</h2>
                <span className="text-sm text-muted-foreground">Free</span>
              </div>
              <ul className="space-y-2 text-sm mt-4 flex-1">
                {[
                  { text: "Face registered", on: true },
                  { text: "Certificate issued", on: true },
                  { text: "Manual search tools", on: true },
                  { text: "Monitoring: Not included", on: false },
                ].map((f) => (
                  <li key={f.text} className="flex gap-2 items-start">
                    {f.on ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <span className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/60">—</span>
                    )}
                    <span className={f.on ? "text-foreground/90" : "text-muted-foreground"}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={continueBasic} variant="outline" size="lg" className="w-full font-display mt-6">
                Continue with Basic <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Pro Shield */}
            <div className="relative rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/10 to-card/40 p-6 flex flex-col shadow-[0_0_40px_-15px_hsl(var(--primary)/0.6)]">
              <Badge className="absolute -top-3 left-6 bg-primary text-primary-foreground border-0">
                <Sparkles className="w-3 h-3 mr-1" /> Recommended
              </Badge>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Full Protection — Pro Shield</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-2xl font-display font-bold text-foreground">$79</span>/mo
              </p>
              <ul className="space-y-2 text-sm mt-4 flex-1">
                {[
                  "Everything in Basic",
                  "24/7 automated monitoring across all platforms",
                  "Real-time alerts to your phone and email",
                  "One-tap DMCA and takedown tools",
                  "Monthly protection report",
                ].map((t) => (
                  <li key={t} className="flex gap-2 items-start">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/90">{t}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={activatePro} size="lg" className="w-full font-display mt-6">
                Activate Pro Shield <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Promo code */}
          <div className="text-center space-y-2">
            {!promoOpen ? (
              <button
                onClick={() => setPromoOpen(true)}
                className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2 transition-colors"
              >
                Have a promo code?
              </button>
            ) : (
              <div className="max-w-sm mx-auto space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                    className="text-sm"
                    onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  />
                  <Button onClick={applyPromo} variant="secondary" size="sm" className="font-display shrink-0">
                    Apply
                  </Button>
                </div>
                {promoError && <p className="text-xs text-destructive">{promoError}</p>}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              You can upgrade to Pro Shield anytime from your dashboard.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingMonitoring;
