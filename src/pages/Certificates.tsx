import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("certificates")
        .select("*, registry_assets(title, asset_type)")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
      setCertificates(data ?? []);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Certificates</h1>
          <p className="text-muted-foreground mt-1">Your verified ownership certificates</p>
        </div>

        {certificates.length === 0 ? (
          <Card className="glass-card border-border/30">
            <CardContent className="py-12 text-center">
              <Award className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No certificates yet. Certificates are issued when your assets are approved.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <Card key={cert.id} className="glass-card border-border/30 glow-gold">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{cert.registry_assets?.title ?? "Asset"}</div>
                      <div className="text-sm text-muted-foreground">
                        Registry ID: <span className="text-primary font-mono">{cert.registry_id}</span> · Issued {new Date(cert.issued_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-accent/10 text-accent">Certified</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default Certificates;
