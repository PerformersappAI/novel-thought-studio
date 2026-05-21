import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/cmf-shield-logo.png";

const LegalAgreementGate = ({ children }: { children: React.ReactNode }) => {
  const { user, legalAccepted, markLegalAccepted, loading } = useAuth();
  const [tosChecked, setTosChecked] = useState(false);
  const [likenessChecked, setLikenessChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tosContent, setTosContent] = useState("");
  const [likenessContent, setLikenessContent] = useState("");

  useEffect(() => {
    const fetchDocs = async () => {
      const { data: tos } = await supabase
        .from("legal_documents")
        .select("content")
        .eq("document_type", "terms")
        .eq("is_active", true)
        .maybeSingle();
      const { data: likeness } = await supabase
        .from("legal_documents")
        .select("content")
        .eq("document_type", "likeness_rights")
        .eq("is_active", true)
        .maybeSingle();
      setTosContent(tos?.content || "Terms of Service — content coming soon.");
      setLikenessContent(likeness?.content || "Likeness Rights Agreement — content coming soon.");
    };
    if (user && legalAccepted === false) fetchDocs();
  }, [user, legalAccepted]);

  if (loading || legalAccepted === null) return null;
  if (legalAccepted) return <>{children}</>;

  const handleAccept = async () => {
    setSubmitting(true);
    // Immutable consent log entries (GDPR / CCPA)
    if (user) {
      const ua = navigator.userAgent;
      await (supabase as any).from("consent_log").insert([
        { user_id: user.id, consent_type: "terms_of_service", granted: true, user_agent: ua },
        { user_id: user.id, consent_type: "likeness_rights", granted: true, user_agent: ua },
      ]);
    }
    await markLegalAccepted();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <div className="glass-card rounded-xl p-8 glow-blue">
          <div className="flex items-center gap-3 mb-6">
            <img src={logo} alt="ClaimMyFace" className="h-10 w-auto" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground mb-1">Legal Agreements</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Please review and accept the following agreements to access your dashboard.
          </p>

          <div className="space-y-4 mb-6">
            <Card className="border-border/30 bg-secondary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Terms of Service</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32 rounded-md border border-border/20 p-3">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{tosContent}</p>
                </ScrollArea>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <Checkbox checked={tosChecked} onCheckedChange={(v) => setTosChecked(!!v)} />
                  <span className="text-sm text-foreground">I have read and agree to the Terms of Service</span>
                </label>
              </CardContent>
            </Card>

            <Card className="border-border/30 bg-secondary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-display">Likeness Rights Agreement</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32 rounded-md border border-border/20 p-3">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{likenessContent}</p>
                </ScrollArea>
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <Checkbox checked={likenessChecked} onCheckedChange={(v) => setLikenessChecked(!!v)} />
                  <span className="text-sm text-foreground">I have read and agree to the Likeness Rights Agreement</span>
                </label>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={handleAccept}
            disabled={!tosChecked || !likenessChecked || submitting}
            className="w-full font-display"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            {submitting ? "Accepting..." : "Accept & Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default LegalAgreementGate;
