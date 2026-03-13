import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminLegalLogs = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200).then(({ data }) => setAuditLogs(data ?? []));
    supabase.from("consent_signatures").select("*").order("signed_at", { ascending: false }).limit(200).then(({ data }) => setSignatures(data ?? []));
  }, []);

  const filteredLogs = auditLogs.filter((l) =>
    !search || l.action?.toLowerCase().includes(search.toLowerCase()) || l.entity_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Legal & Audit Logs</h1>
          <p className="text-muted-foreground mt-1">View system audit trail and consent signatures</p>
        </div>

        <Tabs defaultValue="audit">
          <TabsList className="mb-6">
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="signatures">Consent Signatures</TabsTrigger>
          </TabsList>

          <div className="relative max-w-sm mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter..." className="pl-10" />
          </div>

          <TabsContent value="audit">
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <Card className="glass-card border-border/30">
                  <CardContent className="py-12 text-center">
                    <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No audit logs found.</p>
                  </CardContent>
                </Card>
              ) : (
                filteredLogs.map((log) => (
                  <Card key={log.id} className="glass-card border-border/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">{log.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {log.entity_type}{log.entity_id ? ` · ${log.entity_id.slice(0, 8)}...` : ""} · {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">{log.entity_type}</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="signatures">
            <div className="space-y-2">
              {signatures.length === 0 ? (
                <Card className="glass-card border-border/30">
                  <CardContent className="py-12 text-center">
                    <ScrollText className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No consent signatures found.</p>
                  </CardContent>
                </Card>
              ) : (
                signatures.map((sig) => (
                  <Card key={sig.id} className="glass-card border-border/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">Document v{sig.document_version}</div>
                        <div className="text-xs text-muted-foreground">
                          User: {sig.user_id.slice(0, 8)}... · Signed {new Date(sig.signed_at).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">Signed</Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminLegalLogs;
