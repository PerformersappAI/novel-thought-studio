import { Lock } from "lucide-react";

const SecurityNote = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-border/60 bg-card/40 p-3 flex gap-2 items-start">
    <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
  </div>
);

export default SecurityNote;
