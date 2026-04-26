import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ShieldCheck, Clock, TrendingUp, AlertTriangle, Award, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PerformerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalAssets: 0, pending: 0, approved: 0, certificates: 0 });
  const [recentAssets, setRecentAssets] = useState<any[]>([]);
  const [verified, setVerified] = useState(false);
  const [faceRegistered, setFaceRegistered] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: assets } = await supabase
        .from("registry_assets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const { count: total } = await supabase.from("registry_assets").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { count: pending } = await supabase.from("registry_assets").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending");
      const { count: approved } = await supabase.from("registry_assets").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "approved");
      const { count: certs } = await supabase.from("certificates").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      const { data: ver } = await supabase.from("identity_verifications").select("status").eq("user_id", user.id).maybeSingle();
      const { data: prof } = await supabase.from("profiles").select("face_registered_at").eq("user_id", user.id).maybeSingle();

      setStats({ totalAssets: total ?? 0, pending: pending ?? 0, approved: approved ?? 0, certificates: certs ?? 0 });
      setRecentAssets(assets ?? []);
      setVerified(ver?.status === "approved");
      setFaceRegistered(!!prof?.face_registered_at);
    };
    fetchData();
  }, [user]);

  const statCards = [
    { label: "Total Assets", value: stats.totalAssets, icon: Upload, color: "text-primary" },
    { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-accent" },
    { label: "Approved", value: stats.approved, icon: ShieldCheck, color: "text-primary" },
    { label: "Certificates", value: stats.certificates, icon: FileText, color: "text-accent" },
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent",
    approved: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive",
    revision_requested: "bg-accent/10 text-accent",
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here's your registry overview.</p>
        </div>

        {!faceRegistered && (
          <Card className="border-2 border-[#C0392B] bg-gradient-to-br from-[#C0392B]/20 via-[#C0392B]/5 to-transparent mb-8">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#C0392B] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-widest text-[#C0392B] uppercase mb-1">Step 1 — Get Started</div>
                  <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Start Building Your Face Profile</h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Register your face with 3 quick photos. This creates your timestamped, cryptographic claim of likeness ownership.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/onboarding/profile">
                  <Button size="lg" className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
                    Start Building Your Face Profile <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link to="/dashboard/monitoring">
                  <Button size="lg" variant="outline">
                    <Eye className="w-4 h-4 mr-2" /> Preview Monitoring
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {faceRegistered && verified && stats.totalAssets > 0 && (
          <Card className="border-2 border-[#C0392B] bg-gradient-to-r from-[#C0392B]/15 to-transparent mb-8">
            <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-[#C0392B] flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Your face is registered. Get your official certificate.</div>
                  <div className="text-sm text-muted-foreground">Timestamped, cryptographic proof of likeness ownership.</div>
                </div>
              </div>
              <Link to="/dashboard/certificate">
                <Button className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
                  Download My Face Certificate <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {faceRegistered && (
          <Card className="border border-border/30 bg-card/50 mb-8">
            <CardContent className="p-5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Next: scan the web for unauthorized use of your likeness.</div>
                  <div className="text-sm text-muted-foreground">Cross-platform monitoring across TikTok, Instagram, YouTube and more.</div>
                </div>
              </div>
              <Link to="/dashboard/monitoring">
                <Button variant="default">
                  Open Monitoring <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label} className="glass-card border-border/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAssets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No assets registered yet. Start by uploading your first asset.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAssets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/20">
                    <div>
                      <div className="font-medium text-foreground">{asset.title}</div>
                      <div className="text-sm text-muted-foreground capitalize">{asset.asset_type} · {new Date(asset.created_at).toLocaleDateString()}</div>
                    </div>
                    <Badge variant="secondary" className={statusColors[asset.status] || ""}>
                      {asset.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PerformerDashboard;
