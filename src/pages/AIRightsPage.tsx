import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Loader2, Save } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CONSENT_FIELDS = [
  { key: "voice_cloning" as const, label: "I consent to AI voice cloning" },
  { key: "face_likeness" as const, label: "I consent to AI face/likeness use" },
  { key: "name_use" as const, label: "I consent to AI-generated content using my name" },
  { key: "posthumous_use" as const, label: "I consent to posthumous digital use" },
];

const AIRightsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [consent, setConsent] = useState({
    voice_cloning: false,
    face_likeness: false,
    name_use: false,
    posthumous_use: false,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("ai_consent_declarations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setConsent({
          voice_cloning: data.voice_cloning,
          face_likeness: data.face_likeness,
          name_use: data.name_use,
          posthumous_use: data.posthumous_use,
        });
        setSavedAt(data.updated_at);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);

    // upsert
    const { data: existing } = await supabase
      .from("ai_consent_declarations")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let error: any;
    if (existing) {
      ({ error } = await supabase
        .from("ai_consent_declarations")
        .update({ ...consent })
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase
        .from("ai_consent_declarations")
        .insert({ user_id: user.id, ...consent }));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setSavedAt(new Date().toISOString());
      toast({ title: "AI consent declaration saved" });
    }
  }, [user, consent, toast]);

  const consentedCount = CONSENT_FIELDS.filter((f) => consent[f.key]).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-accent" />
          <h1 className="font-display text-3xl font-bold">AI Usage Rights</h1>
        </div>

        {/* Section 1 — Explanation */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-xl font-bold leading-tight">
              Set the Record: What AI Can and Cannot Do With You
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This page lets you publicly declare your AI consent position. By recording your
              preferences on-chain through ClaimMyFace, you create a timestamped, verifiable record
              of exactly what rights you grant — and what you refuse — regarding artificial
              intelligence use of your voice, face, name, and likeness.
            </p>
          </CardContent>
        </Card>

        {/* Section 2 — Consent Toggles */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-6">
            <h2 className="font-display text-lg font-semibold">Your AI Consent Declaration</h2>

            <div className="space-y-5">
              {CONSENT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center justify-between gap-4">
                  <Label htmlFor={field.key} className="text-sm cursor-pointer flex-1">
                    {field.label}
                  </Label>
                  <Switch
                    id={field.key}
                    checked={consent[field.key]}
                    onCheckedChange={(v) => setConsent((c) => ({ ...c, [field.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <Button onClick={handleSave} disabled={saving} className="font-display">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Declaration
            </Button>
          </CardContent>
        </Card>

        {/* Section 3 — Public Badge */}
        {savedAt && (
          <Card className="glass-card border-border/30">
            <CardContent className="p-6 space-y-3">
              <h2 className="font-display text-lg font-semibold">Your Public Declaration Badge</h2>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600/20 text-green-400 border-green-500/30 px-3 py-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  AI Rights Declared
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(savedAt), "PPP")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {consentedCount} of 4 consented
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AIRightsPage;
