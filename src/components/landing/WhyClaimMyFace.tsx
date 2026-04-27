import { motion } from "framer-motion";
import { Shield, Eye, Gavel } from "lucide-react";

const pillars = [
  {
    icon: Shield,
    title: "You Are the Original",
    body: "AI can clone your face from 3 photos. ClaimMyFace timestamps your registration so you have proof you came first.",
  },
  {
    icon: Eye,
    title: "We Watch So You Don't Have To",
    body: "We monitor 7 platforms and 20+ sources 24/7 for unauthorized use of your face, voice, and name.",
  },
  {
    icon: Gavel,
    title: "From Alert to Action in Minutes",
    body: "When we find unauthorized use we generate your DMCA notice, cease-and-desist, and platform report automatically.",
  },
];

const WhyClaimMyFace = () => {
  return (
    <section className="relative pt-4 pb-20 md:pb-28 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Why <span className="text-gradient-gold">ClaimMyFace?</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-body">
            Three reasons performers register their face here first.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="glass-card rounded-2xl p-7 group hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/25 transition-colors">
                <p.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyClaimMyFace;
