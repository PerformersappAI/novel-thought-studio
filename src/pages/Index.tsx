import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, FileSignature, Stamp, ShieldCheck, AlertTriangle, FileText, Siren, Target, Award, Quote } from "lucide-react";
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

      {/* Your Complete Protection Suite */}
      <section className="relative py-20 md:py-28">
        <div className="container px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Your Complete <span className="text-gradient-gold">Protection Suite</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-body">
              Every tool a performer needs to document, defend, and protect their identity — all in one dashboard.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileSignature, title: "Identity Statement", desc: "Sign a timestamped declaration proving ownership of your face, voice, and likeness." },
              { icon: Stamp, title: "Trademark Kit", desc: "Prepare and file sound marks and visual trademarks to legally protect your identity." },
              { icon: ShieldCheck, title: "AI Usage Rights", desc: "Publicly declare what AI can and cannot do with your voice, face, and name." },
              { icon: AlertTriangle, title: "Report Violation", desc: "File incident reports when your likeness is used without consent on any platform." },
              { icon: FileText, title: "DMCA Generator", desc: "Generate legally formatted DMCA takedown notices ready to send to any platform." },
              { icon: Siren, title: "Emergency Response", desc: "Follow a step-by-step protocol when your identity is being actively misused." },
              { icon: Target, title: "Vault Score", desc: "Track your protection progress and see exactly what steps remain to secure your identity." },
              { icon: Award, title: "Face Certificate", desc: "Receive a cryptographic ownership certificate proving your biometric registration." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="glass-card border-border/30 h-full hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 space-y-3">
                    <feature.icon className="w-6 h-6 text-primary" />
                    <h3 className="font-display font-bold text-sm">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed font-body">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button asChild size="lg" className="font-display text-base font-semibold px-8 h-14 glow-red">
              <Link to="/register">
                Start Protecting Yourself Free <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
