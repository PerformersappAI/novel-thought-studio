import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface Props {
  score: number;
}

const ProtectionScoreCard = ({ score }: Props) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/40 p-6 md:p-8"
      style={{
        background:
          "linear-gradient(135deg, hsl(var(--crimson)) 0%, hsl(var(--crimson-bright)) 50%, hsl(var(--navy-mid)) 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle at 80% 20%, hsl(0 0% 100% / 0.4), transparent 60%)" }} />
      <div className="relative">
        <div className="flex items-center gap-2 text-primary-foreground/90 text-xs font-semibold tracking-widest uppercase mb-3">
          <ShieldCheck className="w-4 h-4" /> Protection Score
        </div>
        <div className="flex items-end gap-3 mb-4">
          <div className="font-display text-6xl md:text-7xl font-extrabold text-primary-foreground leading-none">
            {clamped}
            <span className="text-3xl md:text-4xl align-top">%</span>
          </div>
        </div>
        <div className="h-3 w-full rounded-full bg-primary-foreground/15 overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${clamped}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-primary-foreground"
          />
        </div>
        <p className="text-sm text-primary-foreground/85">
          {clamped === 100
            ? "You're fully protected. Stay vigilant — we'll keep watching."
            : "Complete the steps below to reach 100%."}
        </p>
      </div>
    </motion.div>
  );
};

export default ProtectionScoreCard;
