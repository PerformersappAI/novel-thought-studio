import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, ShieldCheck, Upload, Search, FileCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { icon: UserPlus, title: "Create Account", desc: "Sign up with your email and build your performer profile. It only takes a minute to get started.", color: "primary" },
  { icon: ShieldCheck, title: "Verify Identity", desc: "Upload a government-issued ID and a clear selfie. Our team verifies your identity to ensure authenticity.", color: "primary" },
  { icon: Upload, title: "Upload Assets", desc: "Register your images, voice samples, video clips, or AI model files. Each is hashed and timestamped for ownership proof.", color: "accent" },
  { icon: Search, title: "Get Reviewed", desc: "Our admin team reviews your submissions, verifies authenticity, and approves your registry entries.", color: "accent" },
  { icon: Award, title: "Get Certified", desc: "Receive a unique Registry ID and downloadable certificate with cryptographic proof of ownership.", color: "primary" },
  { icon: FileCheck, title: "Track & Monitor", desc: "Monitor where your likeness is used. Get alerts on potential misuse. Maintain a full audit trail.", color: "accent" },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">From registration to certified protection in six simple steps.</p>
        </motion.div>

        {/* Horizontal step bar */}
        <div className="max-w-4xl mx-auto mb-12 overflow-x-auto">
          <div className="flex items-center justify-center gap-0 min-w-max mx-auto px-4">
            {steps.map((step, i) => {
              const isActive = i === activeStep;
              const Icon = step.icon;
              const isPrimary = step.color === "primary";

              return (
                <div key={step.title} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(i)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative",
                        isActive && isPrimary && "bg-primary/20 border-2 border-primary shadow-[0_0_24px_hsl(210_100%_56%/0.5)] scale-110",
                        isActive && !isPrimary && "bg-accent/20 border-2 border-accent shadow-[0_0_24px_hsl(45_93%_58%/0.5)] scale-110",
                        !isActive && "bg-secondary/50 border border-border/50 group-hover:border-primary/30"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-6 h-6 transition-colors",
                          isActive && isPrimary && "text-primary",
                          isActive && !isPrimary && "text-accent",
                          !isActive && "text-muted-foreground/60 group-hover:text-muted-foreground"
                        )}
                      />
                      {isActive && (
                        <div className={cn(
                          "absolute inset-0 rounded-full animate-pulse opacity-30",
                          isPrimary ? "bg-primary/30" : "bg-accent/30"
                        )} />
                      )}
                      <span className={cn(
                        "absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                        isActive ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
                      )}>
                        {i + 1}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-display font-medium text-center leading-tight max-w-[80px]",
                        isActive && isPrimary && "text-primary",
                        isActive && !isPrimary && "text-accent",
                        !isActive && "text-muted-foreground/60"
                      )}
                    >
                      {step.title}
                    </span>
                  </button>

                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-10 md:w-16 h-0.5 mx-2 mt-[-20px]",
                        i < activeStep ? "bg-primary/60" : "bg-border/40"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="max-w-2xl mx-auto"
          >
            <div className={cn(
              "glass-card rounded-xl p-8 text-center",
              steps[activeStep].color === "primary" ? "glow-blue" : "glow-gold"
            )}>
              <div className={cn(
                "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                steps[activeStep].color === "primary" ? "bg-primary/10" : "bg-accent/10"
              )}>
                {(() => { const Icon = steps[activeStep].icon; return <Icon className={cn("w-8 h-8", steps[activeStep].color === "primary" ? "text-primary" : "text-accent")} />; })()}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                Step {activeStep + 1}: {steps[activeStep].title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">{steps[activeStep].desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HowItWorks;
