import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Clock, DollarSign, TrendingUp } from "lucide-react";

const stats = [
  { label: "Active Licenses", value: "12", icon: FileText, change: "+2", color: "text-primary" },
  { label: "Total Spent", value: "$6,450", icon: DollarSign, change: "", color: "text-accent" },
  { label: "Pending Requests", value: "3", icon: Clock, change: "", color: "text-primary" },
  { label: "Creators Licensed", value: "8", icon: Users, change: "+1", color: "text-primary" },
];

const activeLicenses = [
  { id: 1, creator: "Maya Chen", type: "Commercial", expires: "Mar 2027", status: "active" },
  { id: 2, creator: "James Rodriguez", type: "Non-commercial", expires: "Sep 2026", status: "active" },
  { id: 3, creator: "Sofia Ivanova", type: "Platform-specific", expires: "Jun 2026", status: "expiring" },
  { id: 4, creator: "Aisha Okonkwo", type: "Commercial", expires: "Dec 2026", status: "active" },
];

const BusinessDashboard = () => {
  return (
    <DashboardLayout role="business">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Business Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your AI likeness licenses</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="glass-card border-border/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  {stat.change && (
                    <span className="text-xs text-accent flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> {stat.change}
                    </span>
                  )}
                </div>
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="font-display text-lg">Active Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeLicenses.map((license) => (
                <div key={license.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/20">
                  <div>
                    <div className="font-medium text-foreground">{license.creator}</div>
                    <div className="text-sm text-muted-foreground">{license.type} · Expires {license.expires}</div>
                  </div>
                  <Badge variant={license.status === "expiring" ? "destructive" : "default"}>
                    {license.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default BusinessDashboard;
