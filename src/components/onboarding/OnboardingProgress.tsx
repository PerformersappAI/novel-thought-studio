import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  step: 1 | 2 | 3;
}

const STEPS = [
  { n: 1, label: "Profile" },
  { n: 2, label: "Face Capture" },
  { n: 3, label: "Complete" },
];

const OnboardingProgress = ({ step }: OnboardingProgressProps) => (
  <div className="flex items-center gap-2 sm:gap-4">
    {STEPS.map((s, i) => {
      const done = step > s.n;
      const active = step === s.n;
      return (
        <div key={s.n} className="flex items-center gap-2 sm:gap-4 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors shrink-0",
                done && "bg-primary border-primary text-primary-foreground",
                active && "bg-primary/15 border-primary text-primary",
                !done && !active && "bg-muted/30 border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span
              className={cn(
                "text-xs sm:text-sm font-medium truncate",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Step {s.n} of 3 — {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-px flex-1 transition-colors hidden sm:block",
                done ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

export default OnboardingProgress;
