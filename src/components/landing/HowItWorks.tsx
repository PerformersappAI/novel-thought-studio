import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, ShieldCheck, Upload, Search, FileCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { icon: UserPlus, title: "Create Account", desc: "Sign up and start your identity map. Takes about a minute." },
  { icon: ShieldCheck, title: "Verify Identity", desc: "Upload a government ID and a clear selfie so every match the scanner finds is provably tied to you." },
  { icon: Upload, title: "Map Your Identity", desc: "Add your face, voice, videos, and the names you go by. Each one is hashed and timestamped as proof of ownership." },
  { icon: Search, title: "Scanner Goes Live", desc: "Our scanner starts sweeping the web and social media — Instagram, TikTok, YouTube, Facebook, casting sites, AI/deepfake sources." },
  { icon: Award, title: "Get Certified", desc: "Receive your Registry ID and downloadable certificate with cryptographic proof you mapped your identity here first." },
  { icon: FileCheck, title: "Take Action", desc: "Review every match, dismiss what's yours, and fire DMCA notices, cease-and-desists, or platform reports in one tap." },
];

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="py-24 relative bg-secondary/30">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto font-body">Map your identity, switch on the scanner, and take action — in six steps.</p>
        </motion.div>

        {/* Horizontal step bar */}
        <div className="max-w-4xl mx-auto mb-12 overflow-x-auto pt-2">
          <div className="flex items-center justify-center gap-0 min-w-max mx-auto px-4">
            {steps.map((step, i) => {
              const isActive = i === activeStep;
              const Icon = step.icon;

              return (
                <div key={step.title} className="flex items-center">
                  <button
                    onClick={() => setActiveStep(i)}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div
                      className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                        isActive && "scale-110",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-7 h-7 transition-colors duration-300",
                          isActive && "text-primary drop-shadow-[0_0_8px_hsl(351_83%_42%/0.6)]",
                          !isActive && "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[11px] font-body font-medium text-center leading-tight max-w-[80px]",
                        isActive && "text-primary",
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
                        i < activeStep ? "bg-primary/60" : "bg-white/[0.08]"
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
            <div className="glass-card rounded-xl p-8 text-center glow-red">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-primary/10">
                {(() => { const Icon = steps[activeStep].icon; return <Icon className="w-8 h-8 text-primary" />; })()}
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                Step {activeStep + 1}: {steps[activeStep].title}
              </h3>
              <p className="text-muted-foreground leading-relaxed font-body">{steps[activeStep].desc}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HowItWorks;
