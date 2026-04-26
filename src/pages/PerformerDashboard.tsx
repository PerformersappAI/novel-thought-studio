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

      setStats({ totalAssets: total ?? 0, pending: pending ?? 0, approved: approved ?? 0, certificates: certs ?? 0 });
      setRecentAssets(assets ?? []);
      setVerified(ver?.status === "approved");
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
