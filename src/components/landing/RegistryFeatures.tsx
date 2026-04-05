import { motion } from "framer-motion";
import { Fingerprint, ShieldAlert, FileText, UserCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Fingerprint,
    title: "Register Your Likeness",
    desc: "Submit your headshot, voice sample, and likeness description to create a verified digital identity on the blockchain-grade registry.",
    link: "/signup",
  },
  {
    icon: ShieldAlert,
    title: "Monitor & Report",
    desc: "Report unauthorized use of your likeness with evidence uploads. Track every violation and generate DMCA takedown notices instantly.",
    link: "/signup",
  },
  {
    icon: FileText,
    title: "Protection Certificates",
    desc: "Receive cryptographically hashed certificates with unique registry IDs — immutable proof of your identity ownership.",
    link: "/signup",
  },
  {
    icon: UserCheck,
    title: "Public Verified Profile",
    desc: "Share a verified public profile showcasing your protected assets, verification status, and professional credentials.",
    link: "/signup",
  },
];

const RegistryFeatures = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold font-body mb-4 border border-primary/20">
            Replica Shield Registry
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Your Digital Identity, <span className="text-gradient-crimson">Protected</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-body">
            Register, monitor, and defend your likeness with enterprise-grade tools built for performers.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to={feature.link}
                className="glass-card rounded-xl p-6 flex flex-col h-full group hover:border-primary/30 transition-all duration-500 relative overflow-hidden block"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body flex-1">{feature.desc}</p>
                <div className="flex items-center gap-1 text-primary text-sm font-medium font-body mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  Get started <ArrowRight className="w-4 h-4" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Button asChild size="lg" className="glow-red font-body text-base px-8">
            <Link to="/signup">
              Start Protecting Your Identity
              <ArrowRight className="w-5 h-5 ml-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default RegistryFeatures;
