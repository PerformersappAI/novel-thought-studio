import { Link } from "react-router-dom";
import { Siren, FileText, AlertTriangle, FileArchive, ExternalLink, Scale } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { name: "YouTube Copyright", url: "https://support.google.com/youtube/answer/2807622" },
  { name: "Instagram IP", url: "https://help.instagram.com/contact/552695131608132" },
  { name: "TikTok IP", url: "https://www.tiktok.com/legal/report/Copyright" },
  { name: "Facebook IP", url: "https://www.facebook.com/help/intellectual_property" },
  { name: "X / Twitter IP", url: "https://help.x.com/en/forms/ipi" },
];

const EmergencyResponsePage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Siren className="w-8 h-8 text-destructive" />
          <h1 className="font-display text-3xl font-bold">Emergency Response</h1>
        </div>

        {/* Section 1 — Alert Banner */}
        <div className="rounded-lg bg-destructive/90 border border-destructive p-5">
          <p className="text-sm font-semibold text-destructive-foreground leading-relaxed">
            ⚠️ If your likeness is being used without consent right now, follow these steps immediately.
          </p>
        </div>

        {/* Section 2 — 5-Step Protocol */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-6">
            <h2 className="font-display text-xl font-bold">5-Step Emergency Response Protocol</h2>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center font-display font-bold text-sm">1</div>
                <div>
                  <h3 className="font-display font-semibold text-base">Document Everything</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Screenshot all infringing content with timestamps. Save URLs, usernames, and any identifying details before the content is removed.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center font-display font-bold text-sm">2</div>
                <div>
                  <h3 className="font-display font-semibold text-base">File a DMCA Notice</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate a legally formatted DMCA takedown notice and send it to the platform.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2 font-display">
                    <Link to="/dashboard/dmca">
                      <FileText className="w-3.5 h-3.5 mr-1.5" /> Go to DMCA Generator
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center font-display font-bold text-sm">3</div>
                <div>
                  <h3 className="font-display font-semibold text-base">Report the Incident</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    File a formal incident report through ClaimMyFace to create a permanent record.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2 font-display">
                    <Link to="/dashboard/incident-report">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Go to Report Violation
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center font-display font-bold text-sm">4</div>
                <div>
                  <h3 className="font-display font-semibold text-base">Download Your Evidence Packet</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate a timestamped PDF of all your identity monitoring results for legal use.
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-2 font-display">
                    <Link to="/dashboard/evidence-packet">
                      <FileArchive className="w-3.5 h-3.5 mr-1.5" /> Go to Evidence Packet
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center font-display font-bold text-sm">5</div>
                <div>
                  <h3 className="font-display font-semibold text-base">Contact a Lawyer</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    For urgent legal matters, consult a qualified attorney.
                  </p>
                  <div className="mt-2 rounded-lg border border-accent/30 bg-accent/5 p-3 flex items-start gap-2">
                    <Scale className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Search your state bar association for an entertainment or intellectual property attorney. Many offer free initial consultations for urgent IP matters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3 — Platform Emergency Contacts */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Platform Emergency Contacts</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((p) => (
              <Card key={p.name} className="glass-card border-border/30">
                <CardContent className="p-4 flex flex-col items-start gap-2">
                  <h3 className="font-display font-semibold text-sm">{p.name}</h3>
                  <Button asChild variant="outline" size="sm" className="w-full font-display">
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      Report Now <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmergencyResponsePage;
