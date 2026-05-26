import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Footer = () => {
  const handleAnchor = (href: string) => {
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Bold CTA section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(351 83% 42% / 0.25), transparent 70%)",
          }}
        />
        <div className="container px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Ready to Claim Your Face?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 font-body">
              Join thousands of performers who trust ClaimMyFace to register and defend their likeness.
            </p>
            <Button asChild size="lg" className="font-body text-base font-semibold px-8 h-13 glow-red">
              <Link to="/signup">
                Claim My Face — Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-12 bg-secondary/20">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-8">
            {/* Brand */}
            <div className="md:max-w-xs">
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="font-display text-xs font-bold text-primary-foreground">C</span>
                </div>
                <span className="font-display text-lg font-bold text-foreground">ClaimMyFace</span>
              </Link>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                My Face. My Claim.
              </p>
            </div>

            {/* Links row */}
            <nav className="flex flex-wrap gap-x-6 gap-y-3 md:justify-center items-center">
              <button
                onClick={() => handleAnchor("#how-it-works")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                How It Works
              </button>
              <button
                onClick={() => handleAnchor("#pricing")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                Pricing
              </button>
              <Link
                to="/education"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                Education
              </Link>
              <button
                onClick={() => handleAnchor("#trust")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                Trust
              </button>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body cursor-default">
                Privacy Policy
              </span>
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body cursor-default">
                Terms of Service
              </span>
            </nav>

            {/* Copyright */}
            <div className="md:text-right md:max-w-xs">
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                © 2026 ClaimMyFace / Roberts Entertainment / PerformersappAI
              </p>
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground/80 font-body leading-relaxed text-center md:text-left">
              Built to support performers in the age of AI — inspired by the growing movement to protect every creator's identity, voice, and likeness.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-wider">
                SOC 2 Compliant
              </span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-wider">
                GDPR Ready
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
