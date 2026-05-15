import { motion } from "framer-motion";
import { UserSquare, ShieldCheck, Radar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    n: 1,
    icon: UserSquare,
    title: "Build Your Identity Map",
    desc: "Add your face, voice, videos, and the names you go by — legal name, stage name, AKAs. Each piece is encrypted, hashed, and timestamped as proof it belongs to you.",
    outcome: "You get: A complete, owned map of your face, voice, work, and names",
  },
  {
    n: 2,
    icon: Radar,
    title: "We Scan the Web & Social Media",
    desc: "Our scanner runs 24/7 across Instagram, TikTok, YouTube, Facebook, casting platforms, news sites, ad networks, and known AI/deepfake sources — looking for your mapped identity.",
    outcome: "You get: Continuous matches across the open web and social media",
  },
  {
    n: 3,
    icon: ShieldCheck,
    title: "You Take Action",
    desc: "Review every match in your dashboard. Confirm what's yours, dismiss what isn't, and fire off DMCA notices, cease-and-desists, or platform reports in one tap.",
    outcome: "You get: One-tap takedowns and proof of ownership when you need it",
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
