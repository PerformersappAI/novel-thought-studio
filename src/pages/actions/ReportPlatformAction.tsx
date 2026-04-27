import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ActionPageShell from "./ActionPageShell";
import AiAssistantPanel from "@/components/actions/AiAssistantPanel";
import FieldGuidance from "@/components/actions/FieldGuidance";
import { findFinding } from "@/components/monitoring/findings";

// Direct platform reporting URLs
const PLATFORM_REPORT_URLS: Record<string, string> = {
  Instagram: "https://help.instagram.com/contact/636108708272460",
  TikTok: "https://www.tiktok.com/legal/report/Copyright",
  Facebook: "https://www.facebook.com/help/contact/1758255661104383",
  YouTube: "https://www.youtube.com/copyright_complaint_form",
  "X / Twitter": "https://help.x.com/en/forms/safety-and-sensitive-content/impersonation",
  LinkedIn: "https://www.linkedin.com/help/linkedin/ask/TS-RTNI",
  Shutterstock: "https://www.shutterstock.com/contactus",
  "Meta Ads": "https://www.facebook.com/help/contact/1758255661104383",
};

const ReportPlatformAction = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const finding = findFinding(params.get("findingId"));
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    reporterName: "",
    reportType: finding?.category === "Fake Profiles" ? "Impersonation" : finding?.category === "Deepfakes" ? "Synthetic / manipulated media" : "Intellectual property infringement",
    description: finding ? `${finding.finding}\n\nThis content uses my likeness without authorization. I am the registered rights holder via ClaimMyFace (registry verification on file).` : "",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, legal_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      if (data) setForm((f) => ({ ...f, reporterName: f.reporterName || data.legal_name || data.full_name || "" }));
    });
  }, [user]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const directUrl = finding ? PLATFORM_REPORT_URLS[finding.platform] : undefined;

  const preview = `Platform Report — ${finding?.platform || "[PLATFORM]"}

Report Type: ${form.reportType}
Reported by: ${form.reporterName || "[YOUR NAME]"} (${user?.email || "[email]"})
URL: ${finding?.url || "[URL]"}

Details:
${form.description}

Verification: I am the registered rights holder of this likeness via ClaimMyFace (verified identity on file). Registry record can be confirmed at https://claimmyface.com/verify/${finding?.id || "[id]"}.`;

  const copyAndOpen = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Copied — paste into the platform's form below" });
    if (directUrl) window.open(directUrl, "_blank");
  };

  return (
    <ActionPageShell
      badge="Platform Report"
      title={`Report to ${finding?.platform || "Platform"}`}
      finding={finding}
      explainer="Most platforms (Instagram, TikTok, YouTube, etc.) have their own takedown forms for impersonation, deepfakes, and unauthorized likeness use. Reporting through the platform is often the fastest path to removal — usually 24 hours or less. We'll prepare the report text for you, then open the platform's form so you can paste and submit."
      whatHappensNext={[
        "We pre-fill the report text using your finding details.",
        "You paste it into the platform's official report form (we open it for you).",
        "The platform reviews — typically within 24 hours.",
        "We re-scan the URL and mark this ✅ Resolved if the content is removed.",
      ]}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="font-display text-base">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldGuidance label="Your name" field="reporterName" required hints={["Some platforms require your real name to verify the report."]} actionType="report" finding={finding as any} formValues={form} owner={profile} onAiFill={set("reporterName")}>
                <Input value={form.reporterName} onChange={(e) => set("reporterName")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="Type of violation" field="reportType" required hints={["Pick the category that best matches what's happening — platforms route reports differently based on this.", "Impersonation = fake account using you", "IP infringement = your image/video used without permission", "Synthetic media = AI deepfake"]} actionType="report" finding={finding as any} formValues={form} owner={profile} onAiFill={set("reportType")}>
                <Input value={form.reportType} onChange={(e) => set("reportType")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="Description for the platform" field="description" required hints={["Be factual, not emotional — moderators handle hundreds of reports a day.", "Mention your registered ClaimMyFace verification — many platforms accept third-party rights registries as proof."]} actionType="report" finding={finding as any} formValues={form} owner={profile} onAiFill={set("description")}>
                <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} className="resize-none h-32" />
              </FieldGuidance>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/30">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-display text-base">Ready to Submit</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(preview); setCopied(true); setTimeout(() => setCopied(false), 1500); toast({ title: "Copied" }); }}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />} Copy
                </Button>
                <Button size="sm" onClick={copyAndOpen} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> {directUrl ? "Copy & Open Platform Form" : "Copy"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {directUrl ? (
                <div className="text-xs text-muted-foreground">
                  We'll copy the report text below and open <span className="text-primary">{finding?.platform}'s</span> official report form in a new tab. Paste the text into their form.
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  No direct report URL on file for this platform — copy the text below and search "report" or "copyright" on the platform's help center.
                </div>
              )}
              <pre className="whitespace-pre-wrap text-xs bg-secondary/30 rounded-lg p-4 border border-border/30 max-h-[300px] overflow-y-auto font-mono text-foreground/90">
                {preview}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AiAssistantPanel
            actionType="report"
            finding={finding as any}
            formValues={form}
            owner={profile}
            suggestions={[
              "Which violation type should I pick?",
              "How long does the platform usually take?",
              "What if they reject the report?",
              "Should I also file a DMCA?",
            ]}
          />
        </div>
      </div>
    </ActionPageShell>
  );
};

export default ReportPlatformAction;
