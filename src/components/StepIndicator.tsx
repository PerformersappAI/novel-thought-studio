import { cn } from "@/lib/utils";
import { UserPlus, ShieldCheck, Upload, Search, FileCheck, Award, LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  label: string;
}

const defaultSteps: Step[] = [
  { icon: UserPlus, label: "Create Account" },
  { icon: ShieldCheck, label: "Verify Identity" },
  { icon: Upload, label: "Upload Assets" },
  { icon: Search, label: "Get Reviewed" },
  { icon: Award, label: "Get Certified" },
  { icon: FileCheck, label: "Track & Monitor" },
];

interface StepIndicatorProps {
  currentStep?: number;
  steps?: Step[];
  className?: string;
}

const StepIndicator = ({ currentStep = 0, steps = defaultSteps, className }: StepIndicatorProps) => {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <div className="flex items-center justify-center gap-0 min-w-max mx-auto px-4">
        {steps.map((step, i) => {
          const isComplete = i < currentStep;
          const isActive = i === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 relative",
                    isComplete && "bg-primary/20 border-2 border-primary shadow-[0_0_16px_hsl(210_100%_56%/0.4)]",
                    isActive && "bg-accent/20 border-2 border-accent shadow-[0_0_20px_hsl(45_93%_58%/0.5)] scale-110",
                    !isComplete && !isActive && "bg-secondary/50 border border-border/50"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isComplete && "text-primary",
                      isActive && "text-accent",
                      !isComplete && !isActive && "text-muted-foreground/50"
                    )}
                  />
                  {(isActive || isComplete) && (
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full animate-pulse opacity-30",
                        isActive ? "bg-accent/30" : "bg-primary/20"
                      )}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-display font-medium text-center leading-tight max-w-[70px]",
                    isComplete && "text-primary",
                    isActive && "text-accent",
                    !isComplete && !isActive && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 md:w-12 h-0.5 mx-1 mt-[-20px]",
                    i < currentStep ? "bg-primary/60" : "bg-border/40"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
