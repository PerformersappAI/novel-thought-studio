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

const CeaseDesistAction = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const finding = findFinding(params.get("findingId"));

  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    senderName: "",
    recipientName: "",
    recipientContact: "",
    infringingUrl: finding?.url || "",
    description: finding ? `Unauthorized use of my likeness on ${finding.platform}: ${finding.finding}` : "",
    demand: "Cease all use immediately and remove the content within 7 days. If the use was commercial, I am also entitled to compensation under right-of-publicity laws.",
    deadline: "7 days from receipt of this letter",
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

  const preview = `${new Date().toLocaleDateString()}

${form.recipientName || "[RECIPIENT NAME]"}
${form.recipientContact || "[RECIPIENT CONTACT]"}

Re: CEASE AND DESIST — Unauthorized Use of Likeness

Dear ${form.recipientName || "[RECIPIENT]"},

This letter serves as formal notice that you are using my name, image, and/or likeness without my authorization at the following location(s):

${form.infringingUrl || "[INFRINGING URL]"}

Specifically: ${form.description || "[DESCRIPTION]"}

This use violates my right of publicity and constitutes unauthorized commercial appropriation of my likeness.

DEMAND: ${form.demand}

DEADLINE: ${form.deadline}

Failure to comply may result in legal action seeking injunctive relief, damages, and attorney's fees. Please confirm in writing once the content has been removed.

Sincerely,

${form.senderName || "[YOUR NAME]"}
Email: ${user?.email || "[YOUR EMAIL]"}`;

  const copy = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <ActionPageShell
      badge="Cease & Desist"
      title="Send a Cease & Desist Letter"
      finding={finding}
      explainer="A Cease & Desist (C&D) is a formal demand letter telling someone to stop using your likeness. It's not a court order — but it's a legally significant first step that often resolves the issue without going to court. C&Ds are best when you know who's behind the misuse and want them to stop personally (vs. asking the platform to remove content)."
      whatHappensNext={[
        "We email or mail the letter to the recipient you identified.",
        "Most recipients comply within the deadline to avoid legal escalation.",
        "If they ignore it, the letter strengthens any future lawsuit by proving they were notified.",
        "If the use is commercial, you may also be entitled to monetary damages under right-of-publicity laws.",
      ]}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="font-display text-base">Letter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldGuidance label="Your name" field="senderName" required hints={["Use your legal name."]} actionType="cease-desist" finding={finding as any} formValues={form} owner={profile} onAiFill={set("senderName")}>
                <Input value={form.senderName} onChange={(e) => set("senderName")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="Recipient name" field="recipientName" required hints={["Person or company misusing your likeness.", "If unknown, use 'Account holder of [URL]' — the platform can identify them later."]} actionType="cease-desist" finding={finding as any} formValues={form} owner={profile} onAiFill={set("recipientName")}>
                <Input value={form.recipientName} onChange={(e) => set("recipientName")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="Recipient email or address" field="recipientContact" hints={["Email is fastest. Postal address adds legal weight."]} actionType="cease-desist" finding={finding as any} formValues={form} owner={profile} onAiFill={set("recipientContact")}>
                <Input value={form.recipientContact} onChange={(e) => set("recipientContact")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="URL where the misuse occurs" field="infringingUrl" required hints={["Direct link to the specific post or page."]} actionType="cease-desist" finding={finding as any} formValues={form} owner={profile} onAiFill={set("infringingUrl")}>
                <Input value={form.infringingUrl} onChange={(e) => set("infringingUrl")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance label="Describe how they're using you" field="description" required hints={["What did they take? Photo, video, voice, name?", "Is it commercial (selling something) or personal? Commercial = stronger case."]} actionType="cease-desist" finding={finding as any} formValues={form} owner={profile} onAiFill={set("description")}>
                <Textarea value={form.description} onChange={(e) => set("description")(e.target.value)} className="resize-none h-20" />
              </FieldGuidance>

              <FieldGuidance label="Your demand" field="demand" required hints={["What exactly do you want them to do? Remove? Stop? Pay?", "Be specific so there's no ambiguity if it goes to court later."]} actionType="cease-desist" finding={finding as any} formValues={form} owner={profile} onAiFill={set("demand")}>
                <Textarea value={form.demand} onChange={(e) => set("demand")(e.target.value)} className="resize-none h-20" />
              </FieldGuidance>

              <FieldGuidance label="Deadline" field="deadline" hints={["7 days is standard for an initial C&D.", "Shorter (24-48 hours) for urgent commercial misuse."]} actionType="cease-desist" finding={finding as any} formValues={form} owner={profile} onAiFill={set("deadline")}>
                <Input value={form.deadline} onChange={(e) => set("deadline")(e.target.value)} />
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
                  <Send className="w-3.5 h-3.5 mr-1" /> Send Letter
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-secondary/30 rounded-lg p-4 border border-border/30 max-h-[400px] overflow-y-auto font-mono text-foreground/90">
                {preview}
              </pre>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <AiAssistantPanel
            actionType="cease-desist"
            finding={finding as any}
            formValues={form}
            owner={profile}
            suggestions={[
              "Is my tone right?",
              "Should I demand money or just removal?",
              "What if they don't reply?",
              "When is C&D better than DMCA?",
            ]}
          />
        </div>
      </div>
    </ActionPageShell>
  );
};

export default CeaseDesistAction;
