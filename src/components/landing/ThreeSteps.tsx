import { motion } from "framer-motion";
import { UserSquare, ShieldCheck, Radar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    n: 1,
    icon: UserSquare,
    title: "Register Your Face",
    desc: "Create your profile and capture three photos — front, left profile, right profile. Your face is converted into an encrypted mathematical descriptor and timestamped.",
    outcome: "You get: A permanent legal timestamp proving this is your face",
  },
  {
    n: 2,
    icon: ShieldCheck,
    title: "Get Certified",
    desc: "Receive your Face Registration Certificate — a downloadable PDF with your registry ID, capture date, and cryptographic proof of ownership. Share your verified badge anywhere.",
    outcome: "You get: An official certificate and embeddable verified badge",
  },
  {
    n: 3,
    icon: Radar,
    title: "We Watch. You're Protected.",
    desc: "Our monitoring scans TikTok, Instagram, Facebook, YouTube, casting platforms, ad networks, and deepfake databases 24/7. The moment we find something — we alert you and take action.",
    outcome: "You get: Real-time alerts and one-tap takedown tools",
  },
];

const ThreeSteps = () => {
  return (
    <section id="how-it-works" className="py-24 relative bg-secondary/30">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Three Steps. <span className="text-gradient-gold">Total Protection.</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-body">
            From zero to legally protected in under 10 minutes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-7 relative overflow-hidden group hover:border-primary/40 transition-colors flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="font-display text-6xl md:text-7xl font-bold leading-none text-primary"
                  style={{ textShadow: "0 0 24px hsl(351 83% 42% / 0.45)" }}
                >
                  {s.n}
                </span>
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed mb-5 flex-1">
                {s.desc}
              </p>
              <div className="border-t border-white/[0.08] pt-4">
                <p className="text-sm font-body font-semibold text-gradient-gold leading-snug">
                  → {s.outcome}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <p className="font-display text-xl font-semibold text-foreground mb-4">Ready?</p>
          <Button asChild size="lg" className="font-body text-base font-semibold px-8 h-13 glow-red">
            <Link to="/signup">
              Claim My Face — It's Free
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default ThreeSteps;
