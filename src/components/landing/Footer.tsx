import { Shield, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <>
      {/* Bold CTA section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: "radial-gradient(ellipse at center, hsl(351 83% 42% / 0.25), transparent 70%)",
          }}
        />
        <div className="container px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Ready to Protect Your Likeness?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8 font-body">
              Join thousands of performers who trust Replica Shield to secure their digital identity.
            </p>
            <Button asChild size="lg" className="font-body text-base font-semibold px-8 h-13 glow-red">
              <Link to="/signup">
                Get Started Now
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-12 bg-secondary/20">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <span className="font-display text-xs font-bold text-primary-foreground">R</span>
                </div>
                <span className="font-display text-lg font-bold text-foreground">Replica Shield</span>
              </Link>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                Own Your Identity. Control Your Likeness.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3 text-sm">Platform</h4>
              <div className="flex flex-col gap-2">
                <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Register</Link>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Login</Link>
                <Link to="/education" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Education</Link>
                <Link to="/tools" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Tools</Link>
              </div>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3 text-sm">Resources</h4>
              <div className="flex flex-col gap-2">
                <Link to="/education" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">How It Works</Link>
                <Link to="/education" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">Pricing</Link>
                <Link to="/education" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">FAQ</Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3 text-sm">Legal</h4>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground font-body">Terms of Service</span>
                <span className="text-sm text-muted-foreground font-body">Privacy Policy</span>
                <span className="text-sm text-muted-foreground font-body">Cookie Policy</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.08] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-body">
              © 2026 Replica Shield / Roberts Entertainment · PerformersappAI. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-wider">SOC 2 Compliant</span>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[10px] text-muted-foreground/60 font-body uppercase tracking-wider">GDPR Ready</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
