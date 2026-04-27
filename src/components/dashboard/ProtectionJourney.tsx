import { motion } from "framer-motion";
import { ScanFace, Award, Radar, Zap, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  registered: boolean;
  certified: boolean;
  monitoring: boolean;
  toolsReady: boolean;
}

const STEPS = [
  { key: "registered", label: "REGISTER", sub: "Face Registered", Icon: ScanFace },
  { key: "certified", label: "CERTIFY", sub: "Certificate Downloaded", Icon: Award },
  { key: "monitoring", label: "MONITOR", sub: "Monitoring Active", Icon: Radar },
  { key: "toolsReady", label: "ACT", sub: "Tools Ready", Icon: Zap },
] as const;

const ProtectionJourney = ({ registered, certified, monitoring, toolsReady }: Props) => {
  const status: Record<string, boolean> = { registered, certified, monitoring, toolsReady };
  const completeCount = STEPS.filter((s) => status[s.key]).length;

  let footer: { text: string; tone: "good" | "warn" | "bad" };
  if (completeCount === 4) footer = { text: "You are fully protected. ✓", tone: "good" };
  else if (completeCount === 3) footer = { text: "One step from full protection →", tone: "warn" };
  else footer = { text: "Complete your protection setup →", tone: "bad" };

  const handleClick = (key: string) => {
    if (status[key]) return;
    const targetId = {
      registered: "next-steps",
      certified: "next-steps",
      monitoring: "next-steps",
      toolsReady: "take-action",
    }[key];
    if (targetId) document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur p-5 md:p-6"
    >
      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-4">
        Your Protection Journey
      </div>
      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => {
          const done = status[s.key];
          const Icon = s.Icon;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <button
                onClick={() => handleClick(s.key)}
                className="flex flex-col items-center gap-2 flex-1 group focus:outline-none"
              >
                <div
                  className={cn(
                    "w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all relative",
                    done
                      ? "bg-emerald-500/20 border-2 border-emerald-500 shadow-[0_0_18px_rgb(16_185_129_/_0.4)]"
                      : "bg-secondary/40 border-2 border-border/50 group-hover:border-primary/60"
                  )}
                >
                  {done ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-[10px] md:text-xs font-display font-bold tracking-wider",
                      done ? "text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                  </div>
                  <div className="text-[9px] md:text-[10px] text-muted-foreground/80 mt-0.5 hidden sm:block">
                    {s.sub}
                  </div>
                </div>
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 mt-[-26px]",
                    done && status[STEPS[i + 1].key] ? "bg-emerald-500/60" : "bg-border/40"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 text-center">
        <span
          className={cn(
            "text-sm font-medium",
            footer.tone === "good" && "text-emerald-400",
            footer.tone === "warn" && "text-[hsl(var(--gold))]",
            footer.tone === "bad" && "text-[hsl(var(--crimson-bright))]"
          )}
        >
          {footer.text}
        </span>
      </div>
    </motion.section>
  );
};

export default ProtectionJourney;
