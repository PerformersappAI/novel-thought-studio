import { Link } from "react-router-dom";
import { ArrowRight, FileText, ShieldAlert, Mail, IdCard, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  {
    icon: ShieldAlert,
    title: "File a DMCA Takedown",
    description:
      "Found unauthorized use of your face? Generate a DMCA notice in 60 seconds.",
    cta: "Start DMCA",
    to: "/dashboard/action/dmca",
  },
  {
    icon: FileText,
    title: "Check a Contract",
    description:
      "Paste any contract and our AI flags dangerous AI clauses before you sign.",
    cta: "Check Contract",
    to: "/tools/contract-checker",
  },
  {
    icon: Mail,
    title: "Generate Cease & Desist",
    description:
      "Send a formal legal warning to anyone using your face without permission.",
    cta: "Generate Letter",
    to: "/dashboard/action/cease-desist",
  },
  {
    icon: IdCard,
    title: "Build Your Media Kit",
    description:
      "Create a shareable verified performer profile with your registered credentials.",
    cta: "Build Kit",
    to: "/tools/media-kit",
  },
  {
    icon: Award,
    title: "Download My Certificate",
    description:
      "Download or reshare your official Face Registration Certificate PDF.",
    cta: "Download",
    to: "/dashboard/certificate",
  },
];

const TakeActionList = () => {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold">Take Action</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tools available when you need them.
        </p>
      </div>
      <div className="space-y-3">
        {ACTIONS.map((a) => (
          <div
            key={a.title}
            className="rounded-xl border border-border/30 bg-card/40 hover:bg-card/60 transition-colors p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <a.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-semibold text-foreground">{a.title}</div>
              <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to={a.to}>
                {a.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TakeActionList;
