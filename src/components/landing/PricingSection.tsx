import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Shield, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Plan = {
  name: string;
  label: string;
  price: string;
  period?: string;
  subtitle: string;
  features: string[];
  cta: string;
  href: string;
  note: string;
  variant: "default" | "outline";
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Register Your Face",
    label: "Start Here",
    price: "$29",
    period: "one-time",
    subtitle: "Claim your face. One time. Yours forever.",
    features: [
      "Complete performer profile",
      "3-photo face capture (front, left, right)",
      "Official Face Registration Certificate (PDF)",
      "Unique Registry ID (CMF-2026-XXXXX)",
      "Verified badge for your website",
      "Legal timestamp established",
      "Listed in ClaimMyFace registry",
      "DMCA Takedown Assistant",
    ],
    cta: "Register My Face — $29 →",
    href: `/signup?plan=registration&price=${import.meta.env.VITE_REGISTRATION_PRICE_ID ?? ""}`,
    note: "One-time fee. No subscription required to register.",
    variant: "default",
  },
  {
    name: "Stay Protected",
    label: "Keep Watching",
    price: "$9.99",
    period: "/mo",
    subtitle: "We keep watching. You keep working.",
    features: [
      "Everything in Register",
      "24/7 monitoring across 7 platforms",
      "Real-time face detection alerts",
      "Voice clone detection",
      "Monthly protection report",
      "Face Claim Wizard (all 3 documents)",
      "AI Consent Contract Checker",
      "Priority support",
    ],
    cta: "Activate Monitoring — $9.99/mo →",
    href: `/signup?plan=monthly&price=${import.meta.env.VITE_MONTHLY_PRICE_ID ?? ""}`,
    note: "Cancel anytime. No contracts.",
    variant: "default",
    highlight: true,
  },
  {
    name: "Annual Shield",
    label: "Best Value",
    price: "$79",
    period: "/yr",
    subtitle: "Full protection. One annual payment. Save 34%.",
    features: [
      "Everything in Stay Protected",
      "Annual monitoring report (full year summary)",
      "Priority alert response (within 1 hour)",
      "Face Claim Wizard always included",
      "First access to new tools as they launch",
      "Founding member status",
    ],
    cta: "Get Annual Shield — $79/yr →",
    href: `/signup?plan=annual&price=${import.meta.env.VITE_ANNUAL_PRICE_ID ?? ""}`,
    note: "That's just $6.58/mo. Billed annually.",
    variant: "outline",
  },
  {
    name: "Enterprise",
    label: "For Organizations",
    price: "Custom",
    subtitle: "For talent agencies, studios, and casting platforms.",
    features: [
      "Multi-performer management",
      "Bulk registration",
      "API access for casting platform integration",
      "Dedicated account manager",
      "White-label badge embedding",
      "SLA guarantee",
      "Custom integrations",
    ],
    cta: "Contact Us →",
    href: "mailto:enterprise@claimmyface.com",
    note: "Tailored to your organization's needs.",
    variant: "outline",
  },
];

const compareRows: Array<[string, boolean, boolean]> = [
  ["Face Registration", true, true],
  ["Certificate & Badge", true, true],
  ["DMCA Tools", true, true],
  ["24/7 Monitoring", false, true],
  ["Real-time Alerts", false, true],
  ["Monthly Report", false, true],
  ["Contract Checker", false, true],
];

const faqs = [
  {
    q: "Do I need to pay monthly or can I just register once?",
    a: "You can register once for $29 and keep your certificate and badge forever. The $9.99/mo adds active monitoring — we watch the web for you 24/7. Without monitoring you'd need to search manually.",
  },
  {
    q: "Can I cancel the monthly plan anytime?",
    a: "Yes. Cancel anytime from your dashboard. No contracts, no cancellation fees. Your registration and certificate remain active even after cancelling.",
  },
  {
    q: "Do I need to be in SAG-AFTRA?",
    a: "No. ClaimMyFace is built for every performer — SAG members, Fi-Core, non-union, and emerging talent.",
  },
  {
    q: "What happens when the NO FAKES Act passes?",
    a: "Your registration date becomes your legal timestamp. Performers who registered before the law passes will have the strongest standing under the new federal framework.",
  },
  {
    q: "Is the $29 really just one time?",
    a: "Yes. One payment. Your face is registered and timestamped forever. The monthly plan is optional — it adds the watching and alerting layer on top.",
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
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Claim Your Face. Keep It Protected.
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            One simple registration. One small monthly fee. Total protection.
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
              className={`glass-card rounded-xl p-7 flex flex-col relative overflow-visible ${
                plan.highlight ? "border-primary/60 glow-red" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold font-body whitespace-nowrap shadow-lg">
                  Most Popular
                </div>
              )}
              <div className="mb-5">
                <p className="text-[11px] font-body font-semibold uppercase tracking-wider text-accent mb-2">
                  {plan.label}
                </p>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-muted-foreground font-body text-sm">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-3 font-body italic min-h-[40px]">
                  {plan.subtitle}
                </p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
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
              <div className="mt-auto">
                <Button
                  asChild
                  variant={plan.variant}
                  className={`w-full font-body ${
                    plan.variant === "default"
                      ? "glow-red"
                      : "border-white/[0.15] hover:border-white/30"
                  }`}
                >
                  <Link to={plan.href}>{plan.cta}</Link>
                </Button>
                <p className="text-[11px] text-muted-foreground/80 text-center mt-3 font-body">
                  {plan.note}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Competitor callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mt-16 rounded-xl border border-primary/40 bg-card/40 backdrop-blur p-6 md:p-8 flex items-start gap-4"
        >
          <Shield className="w-6 h-6 text-primary shrink-0 mt-1" />
          <p className="text-foreground font-body text-base md:text-lg leading-relaxed">
            <span className="text-muted-foreground">
              YouTube's likeness tool covers 1 platform and requires a major talent agency.
            </span>{" "}
            <span className="font-semibold">
              ClaimMyFace monitors 7 platforms and costs less than a coffee a week —
              open to every performer, union or not.
            </span>
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-12 rounded-xl glass-card overflow-hidden"
        >
          <div className="grid grid-cols-3 bg-white/[0.04] border-b border-white/[0.08]">
            <div className="p-4 font-display font-semibold text-sm text-foreground">
              Feature
            </div>
            <div className="p-4 font-display font-semibold text-sm text-foreground text-center border-l border-white/[0.08]">
              Register
              <span className="block text-[11px] font-body font-normal text-muted-foreground">
                $29
              </span>
            </div>
            <div className="p-4 font-display font-semibold text-sm text-foreground text-center border-l border-white/[0.08]">
              Stay Protected
              <span className="block text-[11px] font-body font-normal text-muted-foreground">
                $9.99/mo
              </span>
            </div>
          </div>
          {compareRows.map(([feature, a, b], idx) => (
            <div
              key={feature}
              className={`grid grid-cols-3 ${
                idx !== compareRows.length - 1 ? "border-b border-white/[0.06]" : ""
              }`}
            >
              <div className="p-4 text-sm font-body text-foreground">{feature}</div>
              <div className="p-4 text-center border-l border-white/[0.06] flex items-center justify-center">
                {a ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground/50" />
                )}
              </div>
              <div className="p-4 text-center border-l border-white/[0.06] flex items-center justify-center">
                {b ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground/50" />
                )}
              </div>
            </div>
          ))}
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
