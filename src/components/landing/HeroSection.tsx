import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroCreators from "@/assets/hero-creators.jpg";

const FloatingNode = ({ x, y, delay }: { x: string; y: string; delay: number }) => (
  <motion.div
    className="absolute w-1.5 h-1.5 rounded-full bg-primary/40"
    style={{ left: x, top: y }}
    animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
    transition={{ duration: 3, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      {/* Ambient glow spots */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, hsl(80 100% 36% / 0.15), transparent 70%)" }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, hsl(210 100% 56% / 0.1), transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 8, delay: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating nodes */}
      <FloatingNode x="10%" y="20%" delay={0} />
      <FloatingNode x="85%" y="15%" delay={1.2} />
      <FloatingNode x="70%" y="70%" delay={0.6} />
      <FloatingNode x="20%" y="80%" delay={1.8} />
      <FloatingNode x="50%" y="30%" delay={2.4} />
      <FloatingNode x="35%" y="60%" delay={0.9} />

      {/* Main content */}
      <div className="container px-4 relative z-10 py-12 md:py-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-8">
          {/* Left — Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center md:text-left max-w-2xl"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block mb-4 px-3 py-1 rounded-full border border-primary/30 bg-primary/5"
            >
              <span className="text-xs font-display font-medium text-primary tracking-wider uppercase">
                The Industry Standard for Likeness Protection
              </span>
            </motion.div>

            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
              <span className="text-foreground">Your Digital Double,</span>
              <br />
              <span className="text-gradient-green">Ready to Perform.</span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-base md:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed"
            >
              Register, verify, and shield your likeness-based assets with
              cryptographic proof of ownership. The trusted registry for performers
              in the age of AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Button
                asChild
                size="lg"
                className="font-display text-base font-semibold px-8 h-13 glow-green"
              >
                <Link to="/signup">
                  Register Your Likeness
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="font-display text-base px-8 h-13 border-border/60 hover:border-primary/50"
              >
                <Link to="/login">Sign In</Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Right — Hexagonal image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            className="flex-shrink-0 relative"
          >
            {/* Outer glow ring */}
            <div className="absolute inset-0 hexagon-clip bg-gradient-to-br from-primary/30 via-electric-blue/20 to-primary/30 scale-[1.04] blur-sm" />
            
            {/* Pulsing border glow */}
            <motion.div
              className="absolute inset-0 hexagon-clip"
              style={{
                background: "linear-gradient(135deg, hsl(80 100% 36% / 0.3), hsl(210 100% 56% / 0.2), hsl(80 100% 36% / 0.3))",
              }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Image container */}
            <div className="relative w-[280px] h-[320px] md:w-[380px] md:h-[430px] lg:w-[420px] lg:h-[480px] hexagon-clip overflow-hidden">
              <img
                src={heroCreators}
                alt="Performers protected by Replica Shield"
                className="w-full h-full object-cover"
              />
              {/* Digital overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-primary/10" />
              <div className="absolute inset-0 grid-pattern opacity-20" />
            </div>

            {/* Corner accent lines */}
            <motion.div
              className="absolute -top-3 -right-3 w-16 h-16 border-t-2 border-r-2 border-primary/40 rounded-tr-lg"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-3 -left-3 w-16 h-16 border-b-2 border-l-2 border-primary/40 rounded-bl-lg"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, delay: 2, repeat: Infinity }}
            />
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 mt-16 md:mt-24 w-full border-t border-border/30"
      >
        <div className="container px-4 py-8 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { value: "10K+", label: "Performers Protected" },
            { value: "52K", label: "Assets Registered" },
            { value: "100%", label: "Verified Ownership" },
            { value: "24/7", label: "Active Monitoring" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-2xl md:text-3xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
