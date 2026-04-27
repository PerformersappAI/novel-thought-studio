import { Check, Circle } from "lucide-react";

export interface CompletedItem {
  label: string;
  detail?: string;
  done: boolean;
}

const CompletedSteps = ({ items }: { items: CompletedItem[] }) => {
  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="text-emerald-400">✅</span> What You've Done
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
              item.done
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-border/30 bg-card/30 opacity-50"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                item.done ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
              }`}
            >
              {item.done ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            </div>
            <div>
              <div className={`font-medium ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
                {item.label}
              </div>
              {item.detail && (
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">{item.detail}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CompletedSteps;
