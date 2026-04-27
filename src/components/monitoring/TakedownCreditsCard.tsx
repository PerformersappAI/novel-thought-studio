import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { Zap, ArrowRight, Infinity as InfinityIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "cmf_takedown_credits_v1";
const MAX_FREE = 9;
const MONTHLY_GRANT = 3;

interface State {
  balance: number;
  usedThisMonth: number;
  monthKey: string;
}

const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

const loadState = (): State => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s: State = JSON.parse(raw);
      if (s.monthKey !== monthKey()) {
        // grant new monthly credits, cap at MAX_FREE
        const newBal = Math.min(MAX_FREE, s.balance + MONTHLY_GRANT);
        return { balance: newBal, usedThisMonth: 0, monthKey: monthKey() };
      }
      return s;
    }
  } catch {}
  return { balance: MONTHLY_GRANT, usedThisMonth: 0, monthKey: monthKey() };
};

interface Props {
  isPro: boolean;
}

const TakedownCreditsCard = ({ isPro }: Props) => {
  const [state, setState] = useState<State>(loadState);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!isPro) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isPro]);

  // Listen for global takedown events to decrement
  useEffect(() => {
    const onUse = () => {
      if (isPro) return;
      setState((s) => {
        if (s.balance <= 0) return s;
        return { ...s, balance: s.balance - 1, usedThisMonth: s.usedThisMonth + 1 };
      });
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    };
    window.addEventListener("cmf:takedown-used", onUse);
    return () => window.removeEventListener("cmf:takedown-used", onUse);
  }, [isPro]);

  if (isPro) {
    return (
      <Card className="glass-card border-emerald-500/40 bg-emerald-500/5 mb-6">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <InfinityIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="font-display text-lg font-bold text-foreground">
              Unlimited takedowns active ✓
            </div>
            <div className="text-sm text-muted-foreground">
              Pro Shield includes unlimited DMCA & impersonator takedowns.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pct = Math.min(100, (state.usedThisMonth / MONTHLY_GRANT) * 100);
  const empty = state.balance <= 0;

  return (
    <Card className="glass-card border-border/30 mb-6">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center border border-primary/40">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={state.balance}
                    initial={{ y: animate ? -10 : 0, opacity: animate ? 0 : 1 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className="font-display text-2xl font-extrabold text-foreground"
                  >
                    {state.balance}
                  </motion.span>
                </AnimatePresence>
                <span className="text-sm text-muted-foreground">
                  takedown credit{state.balance === 1 ? "" : "s"} available
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Unused credits roll over. Max {MAX_FREE} credits on free plan.
              </div>
            </div>
          </div>
          {empty && (
            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/#pricing">
                Upgrade to Pro Shield <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
        <div className="mt-4">
          <Progress value={pct} />
          <div className="text-[11px] text-muted-foreground mt-1.5">
            {state.usedThisMonth} of {MONTHLY_GRANT} monthly credits used
          </div>
        </div>
        {empty && (
          <div className="mt-3 rounded-lg bg-[hsl(var(--crimson))]/10 border border-[hsl(var(--crimson))]/30 p-3 text-sm text-foreground">
            You've used all your takedown credits this month. Upgrade to Pro Shield for unlimited takedowns.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TakedownCreditsCard;
