import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  Award,
  Footprints,
  ArrowRight,
  Loader2,
  Lock,
  Eye,
  Zap,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import TrustBanner from "@/components/onboarding/TrustBanner";

const OnboardingWhy = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_why_seen")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.onboarding_why_seen) {
        navigate("/onboarding/profile", { replace: true });
        return;
      }
      setChecking(false);
    })();
  }, [user, authLoading, navigate]);

  const onContinue = async () => {
    if (!user) return;
    setContinuing(true);
    try {
      await supabase
        .from("profiles")
        .update({ onboarding_why_seen: true })
        .eq("user_id", user.id);
      navigate("/onboarding/profile");
    } catch (e: any) {
      toast({ title: "Couldn't save", description: e.message, variant: "destructive" });
      setContinuing(false);
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-8">
        <TrustBanner />

        {/* HERO */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-[11px] font-semibold tracking-wider uppercase">
            Before You Begin
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">
            Map Your Identity. <span className="text-primary">We'll Watch the Internet for It.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            We're going to help you map four things — your face, your voice, your work, and your names. Then our scanner watches for them online.
          </p>
        </motion.header>

        {/* SECTION 1 */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold">Your Face, Voice, and Name Can Be Cloned.</h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            AI can clone your face from 3 photos. Your voice from 60 seconds of audio.
            Right now — without your knowledge — deepfake versions of performers are being used
            in ads, scam videos, fake social profiles, and unauthorized commercial content. You
            don't have to be famous to be a target. You just have to exist online. The first
            move is to claim what's yours: build your identity map here.
          </p>
        </motion.section>

        {/* SECTION 2 */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold">
              The Identity Map: Face, Voice, Videos, Names.
            </h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            With your help we collect four things: your <strong>face</strong> (photos and capture),
            your <strong>voice</strong> (a short voiceprint), your <strong>videos</strong> (reels
            and clips), and your <strong>names</strong> (legal name, stage name, AKAs, press).
            Each piece is encrypted, hashed, and timestamped — proof that this identity is yours,
            registered here, on this date, before anyone else claimed it.
          </p>
        </motion.section>

        {/* SECTION 3 */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="font-display text-2xl font-bold">The Scanner: We Watch the Web for You.</h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            Once your map is built, our scanner starts working. It searches Instagram, TikTok,
            YouTube, Facebook, casting platforms, news sites, ad networks, and known AI/deepfake
            sources — looking for anyone using your face, voice, videos, or names without your
            permission. Every match lands in your dashboard with the evidence already attached, so
            you can act in seconds.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { Icon: Lock, label: "Identity Map Secured" },
              { Icon: BadgeCheck, label: "Verified Badge" },
              { Icon: Eye, label: "Scanner Active 24/7" },
              { Icon: Zap, label: "One-Tap Takedowns" },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="rounded-xl border border-border/60 bg-card/40 p-3 flex flex-col items-center text-center gap-2"
              >
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-xs font-medium text-foreground/90 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* SECTION 4 */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card rounded-2xl p-6 sm:p-8 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center shrink-0">
              <Footprints className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold">
              You Own Your Identity. Defend It Now.
            </h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            You insure your car. You lock your front door. You password-protect your phone. Your
            face, voice, and name are worth more than all of those things combined — and right
            now they have zero protection. That ends today. Building your identity map takes about
            10 minutes. The scanner runs for life. And when the NO FAKES Act passes, the
            performers who mapped first will have the strongest legal standing in the industry.
          </p>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4 pt-2"
        >
          <Button
            onClick={onContinue}
            disabled={continuing}
            size="lg"
            className="w-full font-display text-base py-6"
          >
            {continuing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                I'm Ready — Let's Claim My Face <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          <Button
            onClick={() => navigate("/education")}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Learn More in the Education Hub
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Free to start. No credit card required. Your data is encrypted and never shared.
          </p>
        </motion.div>

        {/* LEGAL */}
        <p className="text-[11px] leading-relaxed text-muted-foreground/70 border-t border-border/40 pt-6">
          ClaimMyFace registration creates a timestamped cryptographic record of your likeness
          declaration. © {year} [Performer Legal Name] upon registration. This record strengthens
          your Right of Publicity claim and provides documented evidence to support DMCA takedowns,
          cease and desist actions, and legal proceedings. ClaimMyFace is a private likeness
          registry operated by Roberts Entertainment / PerformersappAI. Registration does not
          constitute legal advice or guarantee legal outcomes. Consult a qualified entertainment
          attorney for personalized legal guidance.
        </p>
      </div>
    </div>
  );
};

export default OnboardingWhy;
