import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, FileSignature, Stamp, ShieldCheck, AlertTriangle, FileText, Siren, Target, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import heroIdBadge from "@/assets/hero-id-badge.png";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  // If already logged in, go straight to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Full-screen hero with single CTA */}
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Background layers */}
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        {/* Ambient glows */}
        <motion.div
          className="absolute top-1/3 left-1/3 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(351 83% 42% / 0.2), transparent 70%)" }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, hsl(42 63% 55% / 0.1), transparent 70%)" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 8, delay: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10 container px-4 flex flex-col items-center text-center max-w-3xl py-16">
          {/* Badge image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-[0_0_40px_hsl(351_83%_42%/0.2)]">
              <img
                src={heroIdBadge}
                alt="ClaimMyFace verified performer ID badge"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-block mb-4 px-3 py-1 rounded-full border border-primary/30 bg-primary/5"
          >
            <span className="text-xs font-body font-medium text-primary tracking-wider uppercase">
              AI is coming for your face. Claim it first.
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            <span className="text-foreground">My Face.</span>{" "}
            <span className="text-gradient-gold">My Claim.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-body"
          >
            The independent registry that proves you own your face — before
            someone else profits from it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              asChild
              size="lg"
              className="font-display text-lg font-semibold px-10 h-16 glow-red"
            >
              <Link to="/register">
                <Shield className="w-5 h-5 mr-2" />
                Protect My Identity
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xs text-muted-foreground mt-6 font-body"
          >
            Free. Takes 5 minutes. No credit card required.
          </motion.p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
