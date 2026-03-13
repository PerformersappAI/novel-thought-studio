import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for creators getting started",
    features: ["1 likeness profile", "Basic licensing templates", "Usage dashboard", "Community support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "/mo",
    desc: "For serious creators and small businesses",
    features: ["Unlimited profiles", "Custom license terms", "Advanced usage analytics", "Priority support", "Verification badge", "API access"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For agencies and large organizations",
    features: ["Team management", "Bulk licensing", "Dedicated account manager", "Custom integrations", "SLA guarantee", "White-label options"],
    cta: "Contact Sales",
    highlight: false,
  },
];

const PricingSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Simple Pricing</h2>
          <p className="text-muted-foreground text-lg">Start free. Scale as you grow.</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`glass-card rounded-xl p-8 flex flex-col ${plan.highlight ? "border-primary/50 glow-blue relative" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold font-display">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-display text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-2">
                  <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={plan.highlight ? "default" : "outline"}
                className={`w-full font-display ${plan.highlight ? "glow-blue" : ""}`}
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
