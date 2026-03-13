import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, FileImage, FileAudio, FileVideo, FileText, Cpu, Users, Upload, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const assetTypeIcons: Record<string, any> = {
  image: FileImage, audio: FileAudio, video: FileVideo, text: FileText, ai_model: Cpu,
};

const AdminReviewQueue = () => {
  const { toast } = useToast();
  const [pendingAssets, setPendingAssets] = useState<any[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"assets" | "verifications">("assets");

  const fetchData = async () => {
    const { data: assets } = await supabase
      .from("registry_assets")
      .select("*, profiles(full_name, display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPendingAssets(assets ?? []);

    const { data: verifications } = await supabase
      .from("identity_verifications")
      .select("*, profiles(full_name, display_name)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setPendingVerifications(verifications ?? []);
  };

  useEffect(() => { fetchData(); }, []);

  const reviewAsset = async (assetId: string, status: "approved" | "rejected") => {
    const updates: any = { status, reviewed_at: new Date().toISOString(), reviewer_notes: notes[assetId] || null };
    
    if (status === "approved") {
      // Generate registry ID
      const registryId = `RS-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${assetId.slice(0, 8).toUpperCase()}`;
      updates.registry_id = registryId;
    }

    const { error } = await supabase.from("registry_assets").update(updates).eq("id", assetId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    if (status === "approved") {
      const asset = pendingAssets.find(a => a.id === assetId);
      if (asset) {
        await supabase.from("certificates").insert({
          asset_id: assetId,
          user_id: asset.user_id,
          registry_id: updates.registry_id,
          certificate_hash: `cert-${Date.now()}-${assetId.slice(0, 8)}`,
        });
      }
    }

    toast({ title: status === "approved" ? "Asset approved!" : "Asset rejected", description: status === "approved" ? "Certificate generated." : "" });
    fetchData();
  };

  const reviewVerification = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("identity_verifications").update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: notes[id] || null,
    }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "Identity verified!" : "Verification rejected" });
    fetchData();
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Review Queue</h1>
          <p className="text-muted-foreground mt-1">Review pending asset registrations and identity verifications</p>
        </div>

        <div className="flex gap-2 mb-6">
          <Button variant={tab === "assets" ? "default" : "outline"} size="sm" onClick={() => setTab("assets")} className="font-display">
            <Upload className="w-4 h-4 mr-1" /> Assets ({pendingAssets.length})
          </Button>
          <Button variant={tab === "verifications" ? "default" : "outline"} size="sm" onClick={() => setTab("verifications")} className="font-display">
            <ShieldCheck className="w-4 h-4 mr-1" /> Verifications ({pendingVerifications.length})
          </Button>
        </div>

        {tab === "assets" && (
          <div className="space-y-4">
            {pendingAssets.length === 0 ? (
              <Card className="glass-card border-border/30">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pending assets to review.</p>
                </CardContent>
              </Card>
            ) : pendingAssets.map((asset) => {
              const Icon = assetTypeIcons[asset.asset_type] || FileText;
              return (
                <Card key={asset.id} className="glass-card border-border/30">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">{asset.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset.profiles?.full_name || "Unknown"} · {asset.asset_type} · {new Date(asset.created_at).toLocaleDateString()}
                          </div>
                          {asset.description && <p className="text-sm text-muted-foreground mt-1">{asset.description}</p>}
                          <div className="text-xs text-muted-foreground mt-1 font-mono">Hash: {asset.file_hash?.slice(0, 24)}...</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <Textarea
                        placeholder="Reviewer notes (optional)"
                        value={notes[asset.id] || ""}
                        onChange={(e) => setNotes({ ...notes, [asset.id]: e.target.value })}
                        className="h-16"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => reviewAsset(asset.id, "approved")}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve & Certify
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => reviewAsset(asset.id, "rejected")}>
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {tab === "verifications" && (
          <div className="space-y-4">
            {pendingVerifications.length === 0 ? (
              <Card className="glass-card border-border/30">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pending verifications to review.</p>
                </CardContent>
              </Card>
            ) : pendingVerifications.map((v) => (
              <Card key={v.id} className="glass-card border-border/30">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{v.profiles?.full_name || "Unknown"}</div>
                      <div className="text-sm text-muted-foreground">Submitted {new Date(v.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Reviewer notes (optional)"
                      value={notes[v.id] || ""}
                      onChange={(e) => setNotes({ ...notes, [v.id]: e.target.value })}
                      className="h-16"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reviewVerification(v.id, "approved")}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => reviewVerification(v.id, "rejected")}>
                        <XCircle className="w-3 h-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminReviewQueue;
