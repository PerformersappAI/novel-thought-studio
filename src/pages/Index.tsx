import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, FileSignature, Stamp, ShieldCheck, AlertTriangle, FileText, Siren, Target, Award, Quote, Check, Star, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import heroIdBadge from "@/assets/hero-id-badge.png";
import deepfakeComparison from "@/assets/deepfake-comparison.png";
import HeroFreeScanWidget from "@/components/landing/HeroFreeScanWidget";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
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

        <div className="relative z-10 container px-4 flex flex-col items-center text-center max-w-6xl py-16">
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
              Prevention is cheaper than control.
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
          >
            <span className="text-foreground">You're not helpless</span>{" "}
            <span className="text-gradient-gold">against AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed font-body"
          >
            Deepfakes, voice clones, and stolen likenesses threaten anyone with a public face — actors, creators, journalists, executives. ClaimMyFace gives you the mirror to see what's out there, the tools to investigate what's fake, and the playbook to fight back.
          </motion.p>

          <div className="grid w-full items-center gap-6 lg:grid-cols-[1fr_1.25fr] lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-xl mx-auto lg:mx-0"
            >
              <HeroFreeScanWidget />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card overflow-hidden rounded-2xl border border-border/40 shadow-[0_24px_80px_hsl(0_0%_0%/0.35)]"
            >
              <img
                src={deepfakeComparison}
                alt="Side-by-side comparison of a real actor headshot and an AI generated deepfake"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-10"
          >
            <Button asChild size="lg" className="font-display text-base font-semibold px-8 h-14 glow-red">
              <Link to="/register">
                Start Protecting Yourself <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* 4 core protections strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl"
          >
            {[
              { icon: "📷", label: "Photo Detection" },
              { icon: "🎬", label: "Video Detection" },
              { icon: "🎙️", label: "Voice Detection" },
              { icon: "✍️", label: "Writing Protection" },
              { icon: "🧬", label: "Deepfake Detection" },
              { icon: "👤", label: "Fake Profile Detection" },
              { icon: "🤖", label: "AI-Generated Content" },
              { icon: "⚠️", label: "Risk Score" },
            ].map((p) => (
              <div
                key={p.label}
                className="glass-card rounded-xl border border-border/30 px-4 py-3 flex items-center gap-2 justify-center"
              >
                <span className="text-xl" aria-hidden>{p.icon}</span>
                <span className="font-body text-sm font-medium text-foreground">{p.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Big Register banner — moved below detection boxes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-14 w-full max-w-3xl"
          >
            <Button
              asChild
              size="lg"
              className="w-full font-display text-lg font-semibold px-10 h-16 glow-red"
            >
              <Link to="/register">
                <Shield className="w-5 h-5 mr-2" />
                Register Your Identity — $19.99 one-time + $9.99/mo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4 font-body text-center">
              One-time registration. Lifetime monitoring across the web.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Your Complete Protection Suite */}
      <section id="how-it-works" className="relative py-20 md:py-28 scroll-mt-20">
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
              { icon: Award, title: "Face Certificate", desc: "Receive a cryptographic ownership certificate proving your headshot registration." },
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

        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 md:py-28 border-t border-border/20">
        <div className="container px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              What Performers Are <span className="text-gradient-gold">Saying</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Sarah K., Commercial Actor", quote: "I found my face being used in an AI ad without my consent. ClaimMyFace gave me the evidence packet and DMCA notice I needed in minutes." },
              { name: "Marcus T., Voice Actor", quote: "The AI Usage Rights declaration alone was worth it. Now I have a timestamped record of exactly what I consented to." },
              { name: "Jenna R., Working Actor", quote: "Every performer needs this. The Vault Score showed me exactly what I was missing and the certificate gives me legal-weight proof of registration." },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-card border-border/30 h-full">
                  <CardContent className="p-6 flex flex-col gap-4">
                    <Quote className="w-5 h-5 text-primary/60" />
                    <p className="text-sm text-muted-foreground leading-relaxed font-body italic">"{t.quote}"</p>
                    <p className="text-sm font-display font-semibold text-foreground mt-auto">{t.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 md:py-28 border-t border-border/20 scroll-mt-20">
        <div className="container px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Choose Your <span className="text-gradient-gold">Protection</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 — Register & Scan */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="glass-card border-border/30 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1 gap-4">
                  <h3 className="font-display text-xl font-bold">Register &amp; Scan</h3>
                  <p className="font-display text-3xl font-bold">$19.99 <span className="text-sm font-normal text-muted-foreground">one-time</span></p>
                  <ul className="space-y-2 flex-1">
                    {["Face registered in vault", "SHA-256 cryptographic certificate", "One full platform scan", "Identity Statement", "DMCA generator access"].map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className="w-full font-display font-semibold glow-red mt-4"
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const res = await supabase.functions.invoke('create-checkout', {
                          body: { price_id: 'price_1TUa9bC3S0CSSOB1qjtoOeJj', user_id: user?.id },
                        });
                        if (res.data?.url) window.location.href = res.data.url;
                        else throw new Error(res.data?.error || 'Could not start checkout');
                      } catch (e: any) { toast.error(e.message); }
                    }}
                  >
                    Get Protected Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 2 — Pro Shield */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <Card className="glass-card border-primary/50 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-display font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Star className="w-3 h-3" /> Most Popular
                </div>
                <CardContent className="p-6 flex flex-col flex-1 gap-4">
                  <h3 className="font-display text-xl font-bold">Pro Shield</h3>
                  <p className="font-display text-3xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                  <ul className="space-y-2 flex-1">
                    {["Everything in Register & Scan", "Continuous automated monitoring", "Real-time match alerts", "Unlimited DMCA notices", "Monthly protection report", "Priority support"].map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    className="w-full font-display font-semibold glow-red mt-4"
                    onClick={async () => {
                      try {
                        const { data: { user } } = await supabase.auth.getUser();
                        const res = await supabase.functions.invoke('create-checkout', {
                          body: { price_id: 'price_1TUaDHC3S0CSSOB1GtTxWynQ', user_id: user?.id },
                        });
                        if (res.data?.url) window.location.href = res.data.url;
                        else throw new Error(res.data?.error || 'Could not start checkout');
                      } catch (e: any) { toast.error(e.message); }
                    }}
                  >
                    Start Pro Shield <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 3 — Enterprise */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Card className="glass-card border-border/30 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col flex-1 gap-4">
                  <h3 className="font-display text-xl font-bold">Enterprise</h3>
                  <p className="font-display text-lg font-semibold text-muted-foreground flex items-center gap-2"><Building2 className="w-5 h-5" /> For agencies, managers &amp; studios</p>
                  <ul className="space-y-2 flex-1">
                    {["Multi-talent vault management", "Bulk registration", "Dedicated account manager", "Custom reporting", "API access"].map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" variant="outline" className="w-full font-display font-semibold mt-4 border-border/50">
                    <a href="mailto:will@claimyourface.com">
                      Contact Us <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-20 md:py-28 border-t border-border/20">
        <div className="container px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked <span className="text-gradient-gold">Questions</span>
            </h2>
          </motion.div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              { q: "Is ClaimMyFace a law firm?", a: "No. ClaimMyFace is a documentation and evidence-vault platform. We help you build timestamped proof of your identity and likeness — but we are not attorneys and do not provide legal advice." },
              { q: "How is this different from just watermarking my photos?", a: "Watermarks can be removed. ClaimMyFace creates SHA-256 cryptographic hashes of your assets, timestamps them on registration, and stores them in a secure vault — creating legal-weight evidence of prior ownership." },
              { q: "What does the $19.99 registration fee cover?", a: "Your one-time registration includes identity verification, face vault setup, your Face Registration Certificate, and your Identity Statement — all timestamped proof of ownership." },
              { q: "Do I need to be in a union to register?", a: "No. ClaimMyFace is open to any performer, creator, or public figure who wants to protect their digital likeness." },
              { q: "What happens if someone is using my face without permission?", a: "Use our Emergency Response protocol — it walks you through documentation, DMCA filing, and incident reporting step by step." },
              { q: "Is my data private?", a: "Yes. Your uploaded assets are stored in a private encrypted vault. We never share, sell, or display your personal assets." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="glass-card border border-border/30 rounded-lg px-5">
                <AccordionTrigger className="font-display text-sm font-semibold text-left hover:no-underline py-4">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground font-body leading-relaxed pb-4">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
