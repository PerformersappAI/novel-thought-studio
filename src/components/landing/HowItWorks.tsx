import { motion } from "framer-motion";
import { UserPlus, Upload, DollarSign, Search, FileText, Zap } from "lucide-react";

const creatorSteps = [
  { icon: UserPlus, title: "Create Your Vault", desc: "Sign up and build your digital identity profile with photos, voice samples, and video." },
  { icon: Upload, title: "Set Your Terms", desc: "Choose licensing tiers—commercial, non-commercial, time-limited—and set your price." },
  { icon: DollarSign, title: "Earn & Track", desc: "Approve requests, track where your likeness is used, and collect royalties." },
];

const businessSteps = [
  { icon: Search, title: "Discover Talent", desc: "Browse verified creators by category, style, and availability for your AI project." },
  { icon: FileText, title: "License Securely", desc: "Select terms, submit a request, and receive a legally-backed digital license." },
  { icon: Zap, title: "Deploy with Confidence", desc: "Use licensed likenesses in your AI products with full usage rights and compliance." },
];

const HowItWorks = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Two sides, one marketplace. Simple for everyone.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Creators */}
          <div>
            <h3 className="font-display text-xl font-semibold text-gradient-blue mb-8 text-center">For Creators</h3>
            <div className="space-y-6">
              {creatorSteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="glass-card rounded-xl p-6 flex gap-5 items-start glow-blue"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-foreground mb-1">{step.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Businesses */}
          <div>
            <h3 className="font-display text-xl font-semibold text-gradient-gold mb-8 text-center">For Businesses</h3>
            <div className="space-y-6">
              {businessSteps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="glass-card rounded-xl p-6 flex gap-5 items-start glow-gold"
                >
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <step.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="font-display font-semibold text-foreground mb-1">{step.title}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
