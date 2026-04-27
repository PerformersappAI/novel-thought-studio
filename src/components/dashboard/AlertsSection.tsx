import { useState } from "react";
import { AlertTriangle, ShieldCheck, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AlertItem {
  id: string;
  platform: string;
  description: string;
  date: string;
  detailsUrl?: string;
}

const AlertsSection = ({ alerts }: { alerts: AlertItem[] }) => {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [open, setOpen] = useState<AlertItem | null>(null);
  const visible = alerts.filter((a) => !dismissed.includes(a.id));

  if (visible.length === 0) {
    return (
      <section>
        <h2 className="font-display text-xl md:text-2xl font-bold mb-4">Alerts</h2>
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">No alerts.</span> We're watching. You'll hear from us the
            moment we find anything.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4 flex items-center gap-2">
        <span className="text-primary">🔴</span> Alerts
      </h2>
      <div className="space-y-3">
        {visible.map((alert) => (
          <div
            key={alert.id}
            className="rounded-xl border border-primary/30 bg-card/60 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {alert.platform}
              </div>
              <div className="font-medium text-foreground mt-0.5">{alert.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Found {new Date(alert.date).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setOpen(alert)}
              >
                See Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDismissed((d) => [...d, alert.id])}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{open?.platform}</DialogTitle>
            <DialogDescription>{open?.description}</DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground space-y-2">
            <div>Date detected: {open && new Date(open.date).toLocaleString()}</div>
            {open?.detailsUrl && (
              <a
                href={open.detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline break-all"
              >
                {open.detailsUrl}
              </a>
            )}
            <p className="pt-2">
              Open the Monitoring page for the full investigation, evidence, and takedown options.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default AlertsSection;
