import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, ShieldCheck, Download } from "lucide-react";

const ScanReports = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Scan Reports
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your scan findings are private. We don't keep a copy.
          </p>
        </div>

        <Card className="p-6 space-y-4 border-primary/30 bg-primary/5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="text-foreground font-medium">
                ClaimMyFace does not retain the findings of your scans.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Results appear live in your dashboard during a scan and disappear
                when you leave the page. This is by design — your potential matches
                stay yours.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If you want a record, use the{" "}
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Download className="w-3.5 h-3.5" /> Download Report (PDF)
                </span>{" "}
                button on the Scanner page right after a scan completes. The PDF
                is generated on your device and never uploaded.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <Button asChild>
              <Link to="/dashboard/monitoring">Go to the Scanner</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <h2 className="font-display text-lg font-semibold">Your legal paper trail</h2>
          <p className="text-sm text-muted-foreground">
            Actions you take — DMCA notices, cease &amp; desist letters, violation
            reports — are stored permanently and cannot be edited or deleted. See
            them on the Scanner page under the <strong>Actions Taken</strong> tab.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ScanReports;
