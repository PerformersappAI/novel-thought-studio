import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroCreators from "@/assets/hero-creators.jpg";
import replicaLogo from "@/assets/replica-shield-logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Full-bleed background image */}
      <img
        src={heroCreators}
        alt="Content creators filming in a professional studio"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      {/* Gradient overlays for seamless fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-background/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_75%)]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Corner logo */}
      <motion.img
        src={replicaLogo}
        alt="Replica Shield"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute top-6 right-6 w-32 md:w-40 z-20"
      />

      <div className="container relative z-10 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center"
        >
          <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-3">
            <span className="text-foreground">Protect Your </span>
            <span className="text-gradient-blue">Likeness.</span>
            <br />
            <span className="text-foreground">Register. Verify. </span>
            <span className="text-gradient-gold">Shield.</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-3 leading-relaxed"
          >
            The trusted registry for performers to register their likeness-based assets, 
            verify ownership, and receive certified protection against unauthorized AI use.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button asChild size="lg" className="font-display text-base px-8 h-13 glow-blue">
              <Link to="/signup">
                Register Your Likeness
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-display text-base px-8 h-13 border-border/60 hover:border-primary/50">
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 mt-12 pt-8 border-t border-border/30"
          >
            {[
              { value: "10K+", label: "Performers Protected" },
              { value: "52K", label: "Assets Registered" },
              { value: "100%", label: "Verified Ownership" },
              { value: "24/7", label: "Active Monitoring" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
