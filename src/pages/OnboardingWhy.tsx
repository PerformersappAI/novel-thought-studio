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
            2 Minutes That Could <span className="text-primary">Save Your Career.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Read this before you register. It matters.
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
            <h2 className="font-display text-2xl font-bold">Your Face Is Already at Risk.</h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            AI can clone your face from just 3 photos. Your voice from 60 seconds of audio. Right
            now — without your knowledge — deepfake versions of performers are being used in ads,
            scam videos, fake social profiles, and unauthorized commercial content. It happened to
            Tom Hanks. It happened to Taylor Swift. It is happening to working actors, voice
            artists, and content creators every single day. You do not have to be famous to be a
            target. You just have to exist online.
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
              The Law Protects You — But Only If You Can Prove You Came First.
            </h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            The Right of Publicity gives every performer legal control over how their face, voice,
            and name are used commercially. But to enforce that right — to file a takedown, send a
            cease and desist, or take legal action — you need proof. Proof that this is your face.
            Proof of when you registered it. Proof that you came before anyone else claimed it.
            ClaimMyFace creates that proof. A timestamped, cryptographically secured record that
            your face is yours — on this date, in this registry, before anyone else.
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
            <h2 className="font-display text-2xl font-bold">In 10 Minutes You Will Have All of This.</h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            When you complete registration you will have an official Face Registration Certificate
            with your unique registry ID and capture date. You will have a verified badge for your
            website, email signature, and social profiles. You will have 24/7 monitoring scanning
            TikTok, Instagram, YouTube, casting platforms, ad networks, and deepfake databases for
            unauthorized use of your face. And you will have the legal foundation to take action
            the moment someone uses your face without your permission.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { Icon: Lock, label: "Official Certificate" },
              { Icon: BadgeCheck, label: "Verified Badge" },
              { Icon: Eye, label: "24/7 Monitoring" },
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
              This Is the Most Important Thing You Can Do for Your Career Right Now.
            </h2>
          </div>
          <p className="text-foreground/85 leading-relaxed">
            You insure your car. You lock your front door. You password-protect your phone. Your
            face is worth more than all of those things combined — and right now it has zero
            protection. That ends today. Registration takes 10 minutes. The protection lasts a
            lifetime. And when the NO FAKES Act passes — performers who registered first will have
            the strongest legal standing of anyone in the industry.
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
