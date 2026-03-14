import { motion } from "framer-motion";
import { Shield, Lock, Eye, FileCheck } from "lucide-react";

const features = [
  { icon: Shield, title: "Identity Verification", desc: "Government ID + live selfie verification ensures every performer profile is authentic." },
  { icon: Lock, title: "Cryptographic Hashing", desc: "Every registered asset receives a unique hash and timestamp — immutable proof of ownership." },
  { icon: Eye, title: "Audit Trail", desc: "All actions are logged immutably. Full transparency for legal compliance and dispute resolution." },
  { icon: FileCheck, title: "Legal Framework", desc: "Version-controlled agreements, consent capture with IP logging, and digital signatures on file." },
];

const TrustSection = () => {
  return (
    <section id="trust" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Built on Trust & Security</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">Enterprise-grade protection for your most valuable asset — your identity.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 text-center group hover:glow-green transition-all duration-500"
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
