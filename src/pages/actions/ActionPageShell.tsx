import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Finding } from "@/components/monitoring/findings";

interface ActionPageShellProps {
  title: string;
  /** Plain-English explanation of the action. */
  explainer: string;
  /** What happens after the user submits. */
  whatHappensNext: string[];
  finding?: Finding;
  /** Two-column body: left = form, right = AI assistant. */
  children: ReactNode;
  /** Action label for the badge ("DMCA", "Cease & Desist", …). */
  badge: string;
}

const ActionPageShell = ({
  title,
  explainer,
  whatHappensNext,
  finding,
  children,
  badge,
}: ActionPageShellProps) => (
  <DashboardLayout>
    <div className="mb-4 flex items-center gap-3 flex-wrap">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/monitoring">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Monitoring
        </Link>
      </Button>
      <Badge className="bg-primary/15 text-primary border border-primary/40">{badge}</Badge>
    </div>

    <div className="mb-2">
      <h1 className="font-display text-2xl md:text-3xl font-bold">{title}</h1>
    </div>

    {/* What is this — explainer banner */}
    <Card className="glass-card border-primary/30 bg-primary/5 mb-6">
      <CardContent className="p-4 flex gap-3">
        <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-2 text-sm">
          <p className="text-foreground">{explainer}</p>
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
              What happens after you send
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
              {whatHappensNext.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Finding context (so they know which match they're acting on) */}
    {finding && (
      <Card className="glass-card border-border/30 mb-6">
        <CardContent className="p-4 flex gap-4 items-center">
          {finding.thumbnailUrl ? (
            <img
              src={finding.thumbnailUrl}
              alt={finding.matchLabel || finding.platform}
              className="w-16 h-16 rounded object-cover border border-border/40"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-secondary/40 border border-border/40" />
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Acting on</div>
            <div className="font-medium text-foreground truncate">
              {finding.matchLabel ? `${finding.matchLabel} — ` : ""}
              {finding.platform}
            </div>
            <div className="text-sm text-muted-foreground truncate">{finding.finding}</div>
            <a
              href={finding.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:underline truncate inline-block max-w-full"
            >
              {finding.url}
            </a>
          </div>
        </CardContent>
      </Card>
    )}

    {children}
  </DashboardLayout>
);

export default ActionPageShell;
