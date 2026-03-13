import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

const features = [
  { icon: Shield, title: "Identity Verification", desc: "Multi-step verification ensures every creator profile is authentic and trustworthy." },
  { icon: Lock, title: "Encrypted Agreements", desc: "All licensing contracts are digitally signed and stored with enterprise-grade encryption." },
  { icon: Eye, title: "Usage Monitoring", desc: "Real-time tracking of where and how your likeness is being used across platforms." },
  { icon: FileCheck, title: "Legal Compliance", desc: "Pre-built license templates reviewed by IP attorneys for maximum legal protection." },
];

const TrustSection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Built on Trust</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Your identity deserves the highest level of protection</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 text-center group hover:glow-blue transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
