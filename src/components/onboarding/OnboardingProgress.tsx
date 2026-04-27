import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  step: 1 | 2 | 3 | 4 | 5;
  /** When true, all steps render as complete (used on the success screen) */
  done?: boolean;
}

const STEPS = [
  { n: 1, label: "Profile" },
  { n: 2, label: "Face Capture" },
  { n: 3, label: "Voice Print" },
  { n: 4, label: "Certificate" },
  { n: 5, label: "Monitoring" },
];

const TOTAL = STEPS.length;

const OnboardingProgress = ({ step, done = false }: OnboardingProgressProps) => (
  <div className="flex items-center gap-2 sm:gap-3">
    {STEPS.map((s, i) => {
      const isDone = done || step > s.n;
      const isActive = !done && step === s.n;
      return (
        <div key={s.n} className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors shrink-0",
                isDone && "bg-emerald-500/15 border-emerald-500 text-emerald-400",
                isActive && "bg-primary/15 border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
                !isDone && !isActive && "bg-muted/30 border-border text-muted-foreground"
              )}
            >
              {isDone ? <Check className="w-4 h-4" /> : s.n}
            </div>
            <span
              className={cn(
                "text-[11px] sm:text-xs font-medium truncate",
                isActive ? "text-foreground" : isDone ? "text-emerald-400/90" : "text-muted-foreground"
              )}
            >
              Step {s.n} of {TOTAL} — {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "h-px flex-1 transition-colors hidden sm:block",
                isDone ? "bg-emerald-500/60" : "bg-border"
              )}
            />
          )}
        </div>
      );
    })}
  </div>
);

export default OnboardingProgress;
