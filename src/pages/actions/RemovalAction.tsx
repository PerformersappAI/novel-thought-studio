import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ActionPageShell from "./ActionPageShell";
import AiAssistantPanel from "@/components/actions/AiAssistantPanel";
import FieldGuidance from "@/components/actions/FieldGuidance";
import { findFinding } from "@/components/monitoring/findings";

const RemovalAction = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const finding = findFinding(params.get("findingId"));
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    senderName: "",
    recipientHint: finding?.platform || "",
    subject: finding ? `Polite request to remove content (${finding.platform})` : "",
    body: finding
      ? `Hi,\n\nI noticed that content of mine appears at: ${finding.url}\n\nThis was published without my authorization. I'd really appreciate if you could take it down — I assume this may have been a misunderstanding rather than something intentional.\n\nFor verification, I'm the registered rights holder via ClaimMyFace (a digital likeness registry).\n\nThanks so much for your help,`
      : "",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, legal_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      if (data) setForm((f) => ({ ...f, senderName: f.senderName || data.legal_name || data.full_name || "" }));
    });
  }, [user]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const preview = `Subject: ${form.subject || "[SUBJECT]"}

${form.body || "[BODY]"}

${form.senderName || "[YOUR NAME]"}
${user?.email || "[YOUR EMAIL]"}`;

  const copy = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <ActionPageShell
      badge="Removal Request"
      title="Send a Polite Removal Request"
      finding={finding}
      explainer="Sometimes the simplest path works best. A friendly removal request is great for low-stakes situations — fan accounts, news articles with old photos, casting platforms with stale data. It avoids escalation and often gets results within a day. If it doesn't work, you can always escalate to a Cease & Desist or DMCA."
      whatHappensNext={[
        "We send a polite, friendly email to the person or page owner.",
        "They usually reply within 1–2 days.",
        "If they comply: we mark this ✅ Resolved on next scan.",
        "If they don't reply or refuse: easily escalate to Cease & Desist or DMCA from this same finding.",
      ]}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="font-display text-base">Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldGuidance label="Your name" field="senderName" required hints={["Use the name they'd recognize you by — stage name is fine here."]} actionType="removal" finding={finding as any} formValues={form} owner={profile} onAiFill={set("senderName")}>
                <Input value={form.senderName} onChange={(e) => set("senderName")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="Subject line" field="subject" required hints={["Keep it clear but non-threatening.", "Avoid words like \"legal\" or \"DMCA\" in the subject — save those for escalation."]} actionType="removal" finding={finding as any} formValues={form} owner={profile} onAiFill={set("subject")}>
                <Input value={form.subject} onChange={(e) => set("subject")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="Email body" field="body" required hints={["Friendly tone, no threats — give them an easy out.", "Briefly explain the situation and what you'd like them to do.", "Mention your verified registry profile to show legitimacy."]} actionType="removal" finding={finding as any} formValues={form} owner={profile} onAiFill={set("body")}>
                <Textarea value={form.body} onChange={(e) => set("body")(e.target.value)} className="resize-none h-40" />
              </FieldGuidance>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/30">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-display text-base">Preview</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />} Copy
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Send className="w-3.5 h-3.5 mr-1" /> Send Email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-secondary/30 rounded-lg p-4 border border-border/30 max-h-[300px] overflow-y-auto font-mono text-foreground/90">
                {preview}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AiAssistantPanel
            actionType="removal"
            finding={finding as any}
            formValues={form}
            owner={profile}
            suggestions={[
              "Make the tone more friendly",
              "Make it more direct",
              "What if they ignore me?",
              "When should I escalate to DMCA?",
            ]}
          />
        </div>
      </div>
    </ActionPageShell>
  );
};

export default RemovalAction;
