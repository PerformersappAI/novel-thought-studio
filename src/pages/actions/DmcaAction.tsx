import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Download, Send, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ActionPageShell from "./ActionPageShell";
import AiAssistantPanel from "@/components/actions/AiAssistantPanel";
import FieldGuidance from "@/components/actions/FieldGuidance";
import { findFinding } from "@/components/monitoring/findings";

const DmcaAction = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const finding = findFinding(params.get("findingId"));

  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({
    ownerName: "",
    ownerAddress: "",
    infringingUrl: finding?.url || "",
    originalWorkDescription: finding
      ? `My registered face/likeness as captured in my ClaimMyFace registry profile (Match: ${finding.matchLabel || finding.platform}). The match was detected with ${finding.confidence}% confidence.`
      : "",
    ownershipProof: "I am the registered rights holder of this likeness via ClaimMyFace registry. Verified identity on file.",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, legal_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      if (data?.legal_name || data?.full_name) {
        setForm((f) => ({ ...f, ownerName: f.ownerName || data.legal_name || data.full_name }));
      }
    });
  }, [user]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const preview = `DMCA Takedown Notice

To Whom It May Concern,

I, ${form.ownerName || "[YOUR NAME]"}, am the registered rights holder of the likeness/work described below, and I am writing to formally request the removal of infringing content under the Digital Millennium Copyright Act (17 U.S.C. § 512(c)(3)).

1. Identification of the copyrighted work:
${form.originalWorkDescription || "[DESCRIBE YOUR WORK]"}

2. Identification of the infringing material:
${form.infringingUrl || "[INFRINGING URL]"}

3. Contact information:
${form.ownerName || "[YOUR NAME]"}
${form.ownerAddress || "[YOUR ADDRESS]"}
Email: ${user?.email || "[YOUR EMAIL]"}

4. Good faith statement:
I have a good faith belief that the use of the material described above is not authorized by me, my agent, or the law.

5. Statement of accuracy:
I swear, under penalty of perjury, that the information in this notice is accurate and that I am the rights holder, or am authorized to act on behalf of the rights holder, of the work that is being infringed.

Signature: ${form.ownerName || "[SIGNATURE]"}
Date: ${new Date().toLocaleDateString()}`;

  const copy = () => {
    navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <ActionPageShell
      badge="DMCA"
      title="File a DMCA Takedown Notice"
      finding={finding}
      explainer="A DMCA notice is a formal legal request under U.S. copyright law (17 U.S.C. § 512) asking the website or platform to remove content that uses your likeness without permission. Once filed, the platform is legally required to respond — they can either remove the content or notify the uploader to dispute it."
      whatHappensNext={[
        "We send your notice to the platform's designated DMCA agent.",
        "The platform usually responds within 24–48 hours, often by removing the content immediately.",
        "If the uploader disputes (rare), you'll get a counter-notice and can decide whether to escalate to court.",
        "We'll re-scan the URL automatically and mark this finding ✅ Resolved if it's gone.",
      ]}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card border-border/30">
            <CardHeader>
              <CardTitle className="font-display text-base">Notice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FieldGuidance
                label="Your full legal name"
                field="ownerName"
                required
                hints={[
                  "Use your legal name, not a stage name — this is a legal document.",
                  "Must match the name on your registered identity verification.",
                ]}
                actionType="dmca"
                finding={finding as any}
                formValues={form}
                owner={profile}
                onAiFill={set("ownerName")}
              >
                <Input value={form.ownerName} onChange={(e) => set("ownerName")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance
                label="Your mailing address"
                field="ownerAddress"
                hints={[
                  "Required by 17 U.S.C. § 512(c)(3)(A)(iv).",
                  "You can use a P.O. box or your agent/lawyer's address if you'd prefer not to share your home.",
                ]}
                actionType="dmca"
                finding={finding as any}
                formValues={form}
                owner={profile}
                onAiFill={set("ownerAddress")}
              >
                <Input value={form.ownerAddress} onChange={(e) => set("ownerAddress")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance
                label="URL of the infringing content"
                field="infringingUrl"
                required
                hints={[
                  "Use the direct link to the specific post, video, or image — not the homepage.",
                  "Multiple URLs? Put one per line.",
                ]}
                actionType="dmca"
                finding={finding as any}
                formValues={form}
                owner={profile}
                onAiFill={set("infringingUrl")}
              >
                <Input value={form.infringingUrl} onChange={(e) => set("infringingUrl")(e.target.value)} />
              </FieldGuidance>

              <FieldGuidance
                label="Description of your original work"
                field="originalWorkDescription"
                required
                hints={[
                  "Describe what they took — your face, voice, photo, performance.",
                  "Reference your ClaimMyFace registry record so the platform can verify ownership quickly.",
                  "Be specific: \"my registered headshot from 2024 captured under registry ID CMF-2025-XXXXX\".",
                ]}
                actionType="dmca"
                finding={finding as any}
                formValues={form}
                owner={profile}
                onAiFill={set("originalWorkDescription")}
              >
                <Textarea
                  value={form.originalWorkDescription}
                  onChange={(e) => set("originalWorkDescription")(e.target.value)}
                  className="resize-none h-24"
                />
              </FieldGuidance>

              <FieldGuidance
                label="Proof of ownership"
                field="ownershipProof"
                hints={[
                  "Your ClaimMyFace registry verification is automatically referenced.",
                  "Add anything else that proves the work is yours — agency contract, original raw file, etc.",
                ]}
                actionType="dmca"
                finding={finding as any}
                formValues={form}
                owner={profile}
                onAiFill={set("ownershipProof")}
              >
                <Textarea
                  value={form.ownershipProof}
                  onChange={(e) => set("ownershipProof")(e.target.value)}
                  className="resize-none h-20"
                />
              </FieldGuidance>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/30">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="font-display text-base">Preview</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copy}>
                  {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  Copy
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Send className="w-3.5 h-3.5 mr-1" /> Send Notice
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
            actionType="dmca"
            finding={finding as any}
            formValues={form}
            owner={profile}
            suggestions={[
              "Is my description strong enough?",
              "What's the difference between DMCA and Cease & Desist?",
              "Do I have a legal right to file this?",
              "What if they ignore the notice?",
            ]}
          />
        </div>
      </div>
    </ActionPageShell>
  );
};

export default DmcaAction;
