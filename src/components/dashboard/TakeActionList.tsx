import { Link } from "react-router-dom";
import { ArrowRight, ShieldAlert, FileSearch, Mic, BadgeCheck, IdCard, UserX, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";

const SITUATIONS = [
  {
    icon: ShieldAlert,
    label: "I found my face used without permission",
    to: "/dashboard/take-action",
  },
  {
    icon: FileSearch,
    label: "I need to review a contract before signing",
    to: "/dashboard/take-action",
  },
  {
    icon: Mic,
    label: "Someone is using my voice without permission",
    to: "/dashboard/take-action",
  },
  {
    icon: BadgeCheck,
    label: "I want to share my verified status",
    to: "/dashboard/take-action",
  },
  {
    icon: IdCard,
    label: "I need to build my media kit",
    to: "/dashboard/take-action",
  },
  {
    icon: UserX,
    label: "I want to report a fake profile using my photos",
    to: "/dashboard/take-action",
  },
];

const TakeActionList = () => {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold">Take Action</h2>
          <p className="text-sm text-muted-foreground mt-1">
            What do you need to do right now?
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link to="/dashboard/take-action">
            See all <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </div>
      <div className="space-y-2">
        {SITUATIONS.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="rounded-xl border border-border/30 bg-card/40 hover:bg-card/60 hover:border-border transition-colors p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <s.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-sm font-medium leading-snug">
              {s.label}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TakeActionList;
