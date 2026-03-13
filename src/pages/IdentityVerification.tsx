import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, AlertTriangle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StepIndicator from "@/components/StepIndicator";

const IdentityVerification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [govId, setGovId] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("identity_verifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setVerification(data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !govId || !selfie) return;
    setUploading(true);

    try {
      const govPath = `${user.id}/gov-id-${Date.now()}`;
      const selfiePath = `${user.id}/selfie-${Date.now()}`;

      const [govUpload, selfieUpload] = await Promise.all([
        supabase.storage.from("verification-docs").upload(govPath, govId),
        supabase.storage.from("verification-docs").upload(selfiePath, selfie),
      ]);
      if (govUpload.error) throw govUpload.error;
      if (selfieUpload.error) throw selfieUpload.error;

      const { error } = await supabase.from("identity_verifications").insert({
        user_id: user.id,
        government_id_url: govPath,
        selfie_url: selfiePath,
      });
      if (error) throw error;

      toast({ title: "Submitted!", description: "Your identity verification is pending review." });
      setGovId(null);
      setSelfie(null);
      const { data } = await supabase.from("identity_verifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      setVerification(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const statusConfig = {
    pending: { icon: Clock, color: "text-accent", label: "Pending Review" },
    approved: { icon: ShieldCheck, color: "text-primary", label: "Verified" },
    rejected: { icon: AlertTriangle, color: "text-destructive", label: "Rejected" },
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Identity Verification</h1>
          <p className="text-muted-foreground mt-1">Verify your identity to unlock full registry access</p>
        </div>

        <StepIndicator currentStep={1} className="mb-8" />

        {!loading && verification ? (
          <Card className="glass-card border-border/30 max-w-xl">
            <CardContent className="p-6">
              {(() => {
                const config = statusConfig[verification.status as keyof typeof statusConfig];
                return (
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${verification.status === "approved" ? "bg-primary/10" : verification.status === "rejected" ? "bg-destructive/10" : "bg-accent/10"}`}>
                      <config.icon className={`w-7 h-7 ${config.color}`} />
                    </div>
                    <div>
                      <div className="font-display font-semibold text-lg text-foreground">{config.label}</div>
                      <div className="text-sm text-muted-foreground">Submitted {new Date(verification.created_at).toLocaleDateString()}</div>
                      {verification.reviewer_notes && (
                        <p className="text-sm text-muted-foreground mt-2">{verification.reviewer_notes}</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        ) : !loading ? (
          <Card className="glass-card border-border/30 max-w-xl glow-blue">
            <CardHeader>
              <CardTitle className="font-display text-lg">Step 2: Verify Your Identity</CardTitle>
              <p className="text-sm text-muted-foreground">Upload a government-issued ID and a clear selfie so our team can confirm you are who you say you are.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Government-Issued ID</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setGovId(e.target.files?.[0] ?? null)} required />
                  <p className="text-xs text-muted-foreground">Passport, driver's license, or national ID card. Must be clear and unobstructed.</p>
                </div>
                <div className="space-y-2">
                  <Label>Live Selfie</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] ?? null)} required />
                  <p className="text-xs text-muted-foreground">A clear, well-lit photo of your face. No sunglasses or hats.</p>
                </div>
                <Button type="submit" disabled={uploading} className="font-display">
                  {uploading ? "Submitting..." : "Submit for Verification"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </motion.div>
    </DashboardLayout>
  );
};

export default IdentityVerification;
