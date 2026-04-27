import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface NextStep {
  title: string;
  description: string;
  cta: string;
  to: string;
}

const NextSteps = ({ steps }: { steps: NextStep[] }) => {
  if (steps.length === 0) return null;
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold flex items-center gap-2">
          <span className="text-primary">→</span> Your Next Steps
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Complete these to reach full protection.
        </p>
      </div>
      <div className="space-y-3">
        {steps.map((s) => (
          <div
            key={s.title}
            className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <div className="font-display font-semibold text-lg text-foreground">{s.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
            </div>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground sm:self-center shrink-0">
              <Link to={s.to}>
                {s.cta} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NextSteps;
