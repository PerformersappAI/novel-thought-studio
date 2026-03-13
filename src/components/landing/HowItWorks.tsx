import { motion } from "framer-motion";
import { UserPlus, Upload, ShieldCheck, Search, FileCheck, Award } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Create Your Account", desc: "Sign up, verify your identity with a government ID and selfie, and build your performer profile." },
  { icon: Upload, title: "Register Your Assets", desc: "Upload images, voice samples, video clips, or AI model files. Each is hashed and timestamped for ownership proof." },
  { icon: ShieldCheck, title: "Admin Verification", desc: "Our team reviews your submissions, verifies authenticity, and approves your registry entries." },
  { icon: Award, title: "Get Certified", desc: "Receive a unique Registry ID and downloadable certificate with cryptographic proof of ownership." },
  { icon: FileCheck, title: "Legal Protection", desc: "Sign consent forms and ownership declarations. All agreements are version-controlled and audit-logged." },
  { icon: Search, title: "Track & Monitor", desc: "Monitor where your likeness is used. Get alerts on potential misuse. Maintain a full audit trail." },
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
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">From registration to certified protection in six steps.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 glow-blue group hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-display font-semibold text-muted-foreground">STEP {i + 1}</span>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
