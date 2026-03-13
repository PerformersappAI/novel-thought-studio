import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import performersHero from "@/assets/performers-hero.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-[120px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="container relative z-10 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.img
            src={logo}
            alt="Replica Shield"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="h-[36rem] md:h-[56rem] w-auto mx-auto mb-0"
          />

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
            className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed"
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-4 -mx-4 md:-mx-8 lg:-mx-16"
          >
            <img
              src={performersHero}
              alt="Performers protected by Replica Shield"
              className="w-full rounded-xl opacity-90"
            />
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
