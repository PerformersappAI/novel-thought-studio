import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroCreators from "@/assets/hero-creators.jpg";
import replicaLogo from "@/assets/replica-shield-logo.png";

const HeroSection = () => {
  return (
    <section className="flex flex-col">
      {/* Hero image area */}
      <div className="relative w-full h-[55vh] md:h-[60vh] overflow-hidden">
        <img
          src={heroCreators}
          alt="Content creators filming in a professional studio"
          className="absolute inset-0 w-full h-full object-cover opacity-55"
        />
        {/* Bottom fade into background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-10" />

        {/* Logo inside image, bottom-right corner */}
        <motion.img
          src={replicaLogo}
          alt="Replica Shield"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-6 right-6 w-28 md:w-36 z-10"
        />
      </div>

      {/* Text content below */}
      <div className="container px-4 py-10 md:py-14">
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
