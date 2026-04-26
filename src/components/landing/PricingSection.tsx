import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Get started and establish your claim date.",
    features: [
      "5 face registrations",
      "Identity verification",
      "Basic certificates",
      "Community support",
    ],
    cta: "Claim My Face Free",
    href: "/signup",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Performer",
    price: "$29",
    period: "/mo",
    desc: "Full protection for working performers.",
    features: [
      "Unlimited registrations",
      "Priority verification",
      "Face Registration Certificate (PDF + QR)",
      "DMCA Takedown Assistant",
      "AI Consent Contract Checker",
      "Legal document library",
      "Priority support",
    ],
    cta: "Go Performer",
    href: "/signup?plan=performer",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Pro Shield",
    price: "$79",
    period: "/mo",
    desc: "Cross-platform face monitoring built for performers.",
    features: [
      "Everything in Performer, plus:",
      "Cross-platform monitoring (7 platforms)",
      "Real-time face detection alerts",
      "Voice fingerprinting",
      "Face Claim Wizard (all 3 documents)",
      "Monthly monitoring report",
      "Dedicated alert dashboard",
    ],
    cta: "Get Pro Shield",
    href: `/signup?plan=pro-shield&price=${import.meta.env.VITE_PRO_SHIELD_PRICE_ID ?? ""}`,
    variant: "default" as const,
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For talent agencies, studios, and casting platforms.",
    features: [
      "Multi-performer management",
      "Bulk registration",
      "API access for casting platform integration",
      "Dedicated account manager",
      "White-label badge embedding",
      "SLA guarantee",
    ],
    cta: "Contact Us",
    href: "mailto:enterprise@claimmyface.com",
    variant: "outline" as const,
    highlight: false,
  },
];

const faqs = [
  {
    q: "Do I need to be in SAG-AFTRA to use ClaimMyFace?",
    a: "No. ClaimMyFace is built for every performer — SAG members, Fi-Core, non-union, and emerging talent. We fill the gap that union contracts and agency tools don't cover.",
  },
  {
    q: "What exactly does face registration protect me from?",
    a: "It creates timestamped, cryptographic proof that you are the original. If someone uses your face, voice, or likeness without permission, your registration is your legal foundation for a DMCA takedown, cease-and-desist, or lawsuit.",
  },
  {
    q: "How is this different from YouTube's likeness detection tool?",
    a: "YouTube's tool covers one platform and is only available through major talent agencies. ClaimMyFace monitors 7 platforms and is open to any performer who registers.",
  },
  {
    q: "What happens when the NO FAKES Act passes?",
    a: "Your registration date becomes your legal timestamp. Performers registered before the law passes will have the strongest standing under the new federal framework.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no cancellation fees. Cancel anytime from your dashboard.",
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Claim Your Face. Choose Your Protection.
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Start free. Upgrade when the stakes get real.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card rounded-xl p-8 flex flex-col relative overflow-hidden ${
                plan.highlight ? "border-primary/50 glow-red" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold font-body whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-2">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground font-body">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2 font-body">{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-foreground font-body"
                  >
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.variant}
                className={`w-full font-body ${
                  plan.highlight
                    ? "glow-red"
                    : "border-white/[0.15] hover:border-white/30"
                }`}
              >
                <Link to={plan.href}>{plan.cta} →</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Competitor callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-12 rounded-xl border border-primary/40 bg-card/40 backdrop-blur p-6 md:p-8 flex items-start gap-4"
        >
          <Shield className="w-6 h-6 text-primary shrink-0 mt-1" />
          <p className="text-foreground font-body text-base md:text-lg leading-relaxed">
            <span className="text-muted-foreground">
              YouTube's likeness tool covers 1 platform and requires a major talent agency.
            </span>{" "}
            <span className="font-semibold">
              ClaimMyFace Pro Shield covers 7 platforms and is open to every performer — union,
              Fi-Core, or independent.
            </span>
          </p>
        </motion.div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-20">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-2xl md:text-4xl font-bold text-center mb-10"
          >
            Frequently Asked Questions
          </motion.h3>
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="glass-card rounded-lg border-white/[0.08] px-5"
              >
                <AccordionTrigger className="font-display text-left text-base md:text-lg text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body text-sm md:text-base leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
