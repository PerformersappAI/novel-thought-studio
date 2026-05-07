import { useEffect, useState, useCallback } from "react";
import { Stamp, Loader2, ExternalLink, Lock, Save } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TrademarkKit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signaturePhrase, setSignaturePhrase] = useState("");
  const [trademarkEntity, setTrademarkEntity] = useState("");
  const [stageName, setStageName] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("signature_phrase, trademark_entity, stage_name, legal_name, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      const name = data?.stage_name || data?.legal_name || data?.full_name || "";
      setStageName(name);
      setSignaturePhrase(data?.signature_phrase || "");
      setTrademarkEntity(data?.trademark_entity || (name ? `${name} Rights Management LLC` : ""));
      setLoading(false);
    })();
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        signature_phrase: signaturePhrase || null,
        trademark_entity: trademarkEntity || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trademark details saved" });
    }
  }, [user, signaturePhrase, trademarkEntity, toast]);

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
          <Stamp className="w-8 h-8 text-accent" />
          <h1 className="font-display text-3xl font-bold">Trademark Kit</h1>
        </div>

        {/* Section 1 — Celebrity context */}
        <Card className="glass-card border-border/30 overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-xl font-bold leading-tight">
              Protect Your Voice &amp; Likeness Like Taylor Swift and Matthew McConaughey
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Both Taylor Swift and Matthew McConaughey have recently filed sound marks and visual
              trademarks to protect their identities from unauthorized AI-generated deepfakes, voice
              clones, and digital replicas. As an actor or performer, you can take the same steps to
              legally own your voice, catchphrase, and likeness — and ClaimMyFace helps you prepare.
            </p>
          </CardContent>
        </Card>

        {/* Section 2 — Trademark Prep */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-5">
            <h2 className="font-display text-lg font-semibold">Your Trademark Prep</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Signature Phrase</Label>
                <Input
                  placeholder={`Hey it's ${stageName || "[your name]"}`}
                  value={signaturePhrase}
                  onChange={(e) => setSignaturePhrase(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The unique phrase audiences associate with you — this can become a registered sound mark.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Your Business Entity Name</Label>
                <Input
                  placeholder={`${stageName || "[Name]"} Rights Management LLC`}
                  value={trademarkEntity}
                  onChange={(e) => setTrademarkEntity(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A rights-management LLC that will own your trademarks and intellectual property.
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="font-display">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Details
            </Button>
          </CardContent>
        </Card>

        {/* Section 3 — Filing Options */}
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Your Filing Options</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Card 1 — DIY Sound Mark */}
            <Card className="glass-card border-border/30 flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1 space-y-3">
                <h3 className="font-display font-semibold text-base">DIY Sound Mark</h3>
                <p className="text-xs text-muted-foreground flex-1">
                  File a sound mark directly at USPTO.gov to protect your signature phrase or vocal
                  identity. Free guidance available on the site.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full font-display">
                  <a href="https://www.uspto.gov/trademarks" target="_blank" rel="noopener noreferrer">
                    Go to USPTO <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Card 2 — DIY Visual Mark */}
            <Card className="glass-card border-border/30 flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1 space-y-3">
                <h3 className="font-display font-semibold text-base">DIY Visual Mark</h3>
                <p className="text-xs text-muted-foreground flex-1">
                  File a visual trademark at USPTO.gov to protect your likeness and signature from
                  unauthorized use.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full font-display">
                  <a href="https://www.uspto.gov/trademarks" target="_blank" rel="noopener noreferrer">
                    Go to USPTO <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Card 3 — Attorney Match (coming soon) */}
            <Card className="glass-card border-border/30 flex flex-col opacity-50 pointer-events-none select-none">
              <CardContent className="p-5 flex flex-col flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-base">Attorney Match</h3>
                  <Badge variant="outline" className="text-[10px] border-accent/40 text-accent">
                    Pro+
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex-1">
                  Get matched with a trademark attorney who specializes in entertainment and
                  performer rights.
                </p>
                <Button variant="outline" size="sm" className="w-full font-display" disabled>
                  <Lock className="w-3.5 h-3.5 mr-1.5" /> Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrademarkKit;
