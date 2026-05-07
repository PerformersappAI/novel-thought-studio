import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface VaultItem {
  label: string;
  done: boolean;
  points: number;
  linkTo: string;
  linkLabel: string;
}

interface Props {
  items: VaultItem[];
}

const VaultCompletionScore = ({ items }: Props) => {
  const earned = items.filter(i => i.done).reduce((s, i) => s + i.points, 0);
  const total = items.reduce((s, i) => s + i.points, 0);
  const pct = Math.round((earned / total) * 100);

  const radius = 70;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/30 bg-card/40 p-6 md:p-8"
    >
      <h2 className="font-display text-xl md:text-2xl font-bold mb-6">Your Protection Score</h2>

      <div className="flex flex-col items-center mb-8">
        <div className="relative w-44 h-44">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={stroke}
            />
            <motion.circle
              cx="80" cy="80" r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-extrabold text-foreground">{pct}%</span>
            <span className="text-xs text-muted-foreground mt-1">{earned}/{total} pts</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
              item.done
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-destructive/30 bg-destructive/5"
            }`}
          >
            {item.done ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
            )}
            <span className={`flex-1 text-sm font-medium ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
              {item.label}
              <span className="text-xs text-muted-foreground ml-2">({item.points} pts)</span>
            </span>
            {!item.done && (
              <Button asChild size="sm" variant="outline" className="shrink-0 text-xs gap-1">
                <Link to={item.linkTo}>
                  {item.linkLabel} <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default VaultCompletionScore;
