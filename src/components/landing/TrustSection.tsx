import { motion } from "framer-motion";
import { Shield, Lock, ShieldCheck, Check } from "lucide-react";

const TrustSection = () => {
  return (
    <section id="trust" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl border-2 border-primary/40 bg-card/60 backdrop-blur-xl p-8 md:p-14 text-center overflow-hidden glow-red">
            {/* Ambient crimson glow */}
            <div
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at top, hsl(351 83% 42% / 0.18), transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>

              <h2 className="font-display text-3xl md:text-5xl font-bold mb-5 leading-tight">
                Your Face Data Is Yours. <span className="text-gradient-gold">Period.</span>
              </h2>

              <p className="text-muted-foreground text-base md:text-lg font-body leading-relaxed max-w-2xl mx-auto mb-8">
                Everything you register is encrypted with AES-256, stored privately, and never sold,
                shared, or used to train AI. Ever. You can delete your account and all data at any time.
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] text-sm font-body text-foreground">
                  <Lock className="w-4 h-4 text-primary" />
                  AES-256 Encrypted
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] text-sm font-body text-foreground">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  SOC 2 Compliant
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] text-sm font-body text-foreground">
                  <Check className="w-4 h-4 text-accent" />
                  Never Sold or Shared
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
