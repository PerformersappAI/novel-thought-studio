import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminUsers = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [verifications, setVerifications] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setProfiles(profs ?? []);

      const { data: vers } = await supabase.from("identity_verifications").select("user_id, status");
      const map: Record<string, string> = {};
      (vers ?? []).forEach((v: any) => { map[v.user_id] = v.status; });
      setVerifications(map);
    };
    fetch();
  }, []);

  const filtered = profiles.filter((p) =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor: Record<string, string> = {
    approved: "bg-primary/10 text-primary",
    pending: "bg-accent/10 text-accent",
    rejected: "bg-destructive/10 text-destructive",
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">{profiles.length} registered users</p>
          </div>
        </div>

        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="pl-10" />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="glass-card border-border/30">
              <CardContent className="py-12 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No users found.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((p) => (
              <Card key={p.id} className="glass-card border-border/30">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">{p.full_name || "Unnamed"}</div>
                    <div className="text-sm text-muted-foreground">
                      {p.display_name && <span>{p.display_name} · </span>}
                      Joined {new Date(p.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant="secondary" className={statusColor[verifications[p.user_id]] || "bg-secondary text-muted-foreground"}>
                    {verifications[p.user_id] || "unverified"}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminUsers;
