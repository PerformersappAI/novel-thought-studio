import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, AlertTriangle, Clock } from "lucide-react";

const usageLogs = [
  { id: 1, platform: "TechVoice AI Assistant", type: "Voice", licensee: "TechVoice AI", date: "2026-03-10", status: "authorized" },
  { id: 2, platform: "MediaGen Ad Campaign", type: "Face", licensee: "MediaGen Corp", date: "2026-03-08", status: "authorized" },
  { id: 3, platform: "Unknown Platform", type: "Voice", licensee: "Unknown", date: "2026-03-05", status: "flagged" },
  { id: 4, platform: "SpeakBot Mobile App", type: "Voice", licensee: "SpeakBot Inc", date: "2026-02-28", status: "authorized" },
  { id: 5, platform: "Old Campaign Site", type: "Face", licensee: "AI Studios", date: "2026-02-20", status: "expired" },
  { id: 6, platform: "AI Tutor Platform", type: "Voice", licensee: "EduAI Co", date: "2026-02-15", status: "authorized" },
];

const statusConfig = {
  authorized: { icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10", label: "Authorized" },
  flagged: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Flagged" },
  expired: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted", label: "Expired" },
};

const UsageTracking = () => {
  const authorized = usageLogs.filter((l) => l.status === "authorized").length;
  const flagged = usageLogs.filter((l) => l.status === "flagged").length;
  const expired = usageLogs.filter((l) => l.status === "expired").length;

  return (
    <DashboardLayout role="creator">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Usage Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor where and how your likeness is being used</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card border-border/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-foreground">{authorized}</div>
                <div className="text-sm text-muted-foreground">Authorized</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-foreground">{flagged}</div>
                <div className="text-sm text-muted-foreground">Flagged</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/30">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-foreground">{expired}</div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="font-display text-lg">Usage Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Licensee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLogs.map((log) => {
                  const config = statusConfig[log.status as keyof typeof statusConfig];
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.platform}</TableCell>
                      <TableCell>{log.type}</TableCell>
                      <TableCell>{log.licensee}</TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${config.bg} ${config.color} border-0`}>
                          <config.icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default UsageTracking;
