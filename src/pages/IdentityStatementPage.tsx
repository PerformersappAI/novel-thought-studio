import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const IdentityStatementPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [legalName, setLegalName] = useState("");
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingStatement, setExistingStatement] = useState<{ digital_signature: string; signed_at: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("legal_name, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setLegalName(profile?.legal_name || profile?.full_name || "");

      const { data: stmt } = await supabase
        .from("identity_statements")
        .select("digital_signature, signed_at")
        .eq("user_id", user.id)
        .order("signed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (stmt) setExistingStatement(stmt);
      setLoading(false);
    };
    load();
  }, [user]);

  const statementText = `I, ${legalName || "[Your Legal Name]"}, confirm that all uploaded images, voice recordings, video samples, and professional links in my ClaimMyFace vault represent my own face, voice, likeness, and professional acting identity. I understand ClaimMyFace is a documentation and evidence-vault platform and does not replace legal advice. This statement was created on ${today} and is timestamped as proof of identity registration.`;

  const handleSign = async () => {
    if (!user || !signature.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("identity_statements").insert({
      user_id: user.id,
      statement_text: statementText,
      digital_signature: signature.trim(),
      signed_at: new Date().toISOString(),
    } as any);
    if (error) {
      toast({ title: "Error", description: "Failed to save statement.", variant: "destructive" });
    } else {
      setExistingStatement({ digital_signature: signature.trim(), signed_at: new Date().toISOString() });
      toast({ title: "Statement Signed", description: "Your identity statement has been locked." });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Identity Statement</h1>
          <p className="text-muted-foreground mt-1">Your sworn digital identity declaration</p>
        </div>

        {existingStatement ? (
          <div className="space-y-6">
            <div className="bg-card border border-border/40 rounded-xl p-6">
              <p className="text-foreground/90 leading-relaxed italic">"{statementText}"</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-600/20 text-green-400 border-green-500/30 gap-2 px-4 py-2 text-sm">
                <ShieldCheck className="w-4 h-4" />
                Identity Statement Signed —{" "}
                {new Date(existingStatement.signed_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Badge>
            </div>
            <div className="bg-card/50 border border-border/30 rounded-lg p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground font-medium">Signed by: {existingStatement.digital_signature}</p>
                <p className="text-xs text-muted-foreground">This statement is locked and timestamped.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card border border-border/40 rounded-xl p-6">
              <p className="text-foreground/90 leading-relaxed">{statementText}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Digital Signature — Type your full legal name to sign
              </label>
              <Input
                placeholder="Type your full legal name"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="font-serif italic text-lg"
              />
            </div>

            <Button
              onClick={handleSign}
              disabled={!signature.trim() || saving}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              {saving ? "Signing..." : "Sign & Lock Statement"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default IdentityStatementPage;
