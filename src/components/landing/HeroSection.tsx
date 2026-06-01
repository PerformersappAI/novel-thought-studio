import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, CheckCircle, Fingerprint } from "lucide-react";
import { Link } from "react-router-dom";
import heroIdBadge from "@/assets/hero-id-badge.png";
import HeroFreeScanWidget from "./HeroFreeScanWidget";

const TrustChip = ({ children, delay }: { children: React.ReactNode; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs font-body text-muted-foreground backdrop-blur-sm"
  >
    {children}
  </motion.div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      {/* Ambient glow — crimson */}
      <motion.div
        className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(351 83% 42% / 0.2), transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.22, 0.12] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, hsl(42 63% 55% / 0.1), transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }}
        transition={{ duration: 8, delay: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main content */}
      <div className="container px-4 relative z-10 py-12 md:py-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center md:text-left max-w-2xl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4 px-3 py-1 rounded-full border border-primary/30 bg-primary/5"
            >
              <span className="text-xs font-body font-medium text-primary tracking-wider uppercase">
                Built for actors, performers, and anyone whose face, voice, or name can be cloned by AI
              </span>
            </motion.div>

            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 leading-[1.1]">
              <span className="text-foreground">You're not helpless</span>
              <br />
              <span className="text-gradient-gold">against AI.</span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed font-body"
            >
              Deepfakes, voice clones, and stolen likenesses threaten anyone with a
              public face — actors, creators, journalists, executives. ClaimMyFace
              gives you the mirror to see what's out there, the tools to investigate
              what's fake, and the playbook to fight back.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="font-body text-base font-semibold px-8 h-13 glow-red"
              >
                <Link to="/signup">
                  Start My Identity Map — Free
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-body text-base px-8 h-13 border-white/[0.15] hover:border-white/30"
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </motion.div>

            {/* Trust chips */}
            <div className="flex flex-wrap gap-2 mt-6 justify-center md:justify-start">
              <TrustChip delay={1.0}>
                <CheckCircle className="w-3.5 h-3.5 text-accent" />
                Face Mapped
              </TrustChip>
              <TrustChip delay={1.2}>
                <Shield className="w-3.5 h-3.5 text-primary" />
                Voice Mapped
              </TrustChip>
              <TrustChip delay={1.4}>
                <Fingerprint className="w-3.5 h-3.5 text-accent" />
                Scanner Active
              </TrustChip>
            </div>

            <HeroFreeScanWidget />
          </motion.div>

          {/* Right — Floating credential card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="flex-shrink-0 relative"
          >
            {/* Card container */}
            <div className="relative w-[300px] md:w-[360px] rounded-2xl overflow-hidden glass-card group">
              {/* ID badge image */}
              <div className="relative aspect-square overflow-hidden bg-[#0B1526]">
                <img
                  src={heroIdBadge}
                  alt="ClaimMyFace verified performer ID badge with locked face and gold padlock"
                  className="w-full h-full object-cover"
                  width={1024}
                  height={1024}
                />
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-accent/90 text-accent-foreground text-[10px] font-body font-semibold uppercase tracking-wider">
                  Verified
                </div>
              </div>

              {/* Card body */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground text-sm">ClaimMyFace Digital Registry</p>
                    <p className="text-[11px] text-muted-foreground font-body">Face & Likeness Protection</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs font-body text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Registry ID</span>
                    <span className="text-foreground font-medium">CMF-2026-00482</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assets Protected</span>
                    <span className="text-foreground font-medium">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Face Status</span>
                    <span className="text-primary font-medium">Claimed & Protected</span>
                  </div>
                </div>
              </div>

              {/* Crimson hover border reveal */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </div>

            {/* Floating decorative accent */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 border-t-2 border-r-2 border-primary/30 rounded-tr-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-20 h-20 border-b-2 border-l-2 border-accent/30 rounded-bl-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, delay: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>

      {/* Stats bar — crimson */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 mt-16 md:mt-24 w-full bg-primary"
      >
        <div className="container px-4 py-6 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: "10K+", label: "Performers Protected" },
            { value: "52K", label: "Faces Registered" },
            { value: "100%", label: "Verified Ownership" },
            { value: "24/7", label: "Active Monitoring" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl md:text-3xl font-bold text-primary-foreground">
                {stat.value}
              </div>
              <div className="text-sm text-primary-foreground/70 mt-1 font-body">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
