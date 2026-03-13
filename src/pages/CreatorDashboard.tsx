import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, FileText, Eye, ShieldCheck, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

const stats = [
  { label: "Total Earnings", value: "$4,280", icon: DollarSign, change: "+12%", color: "text-accent" },
  { label: "Active Licenses", value: "18", icon: FileText, change: "+3", color: "text-primary" },
  { label: "Profile Views", value: "1,247", icon: Eye, change: "+24%", color: "text-primary" },
  { label: "Verification", value: "Verified", icon: ShieldCheck, change: "", color: "text-accent" },
];

const recentRequests = [
  { id: 1, business: "TechVoice AI", type: "Commercial", duration: "12 months", price: "$500", status: "pending" },
  { id: 2, business: "MediaGen Corp", type: "Non-commercial", duration: "6 months", price: "$200", status: "pending" },
  { id: 3, business: "SpeakBot Inc", type: "Platform-specific", duration: "3 months", price: "$350", status: "approved" },
  { id: 4, business: "AI Studios", type: "Commercial", duration: "12 months", price: "$750", status: "declined" },
];

const CreatorDashboard = () => {
  return (
    <DashboardLayout role="creator">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
        </div>

        {/* Stats grid */}
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

        {/* Recent requests */}
        <Card className="glass-card border-border/30">
          <CardHeader>
            <CardTitle className="font-display text-lg">Recent License Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/20">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{req.business}</div>
                    <div className="text-sm text-muted-foreground">{req.type} · {req.duration}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-display font-semibold text-foreground">{req.price}</span>
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="h-8">
                          <CheckCircle className="w-3 h-3 mr-1" /> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="h-8">
                          <XCircle className="w-3 h-3 mr-1" /> Decline
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={req.status === "approved" ? "default" : "secondary"}>
                        {req.status === "approved" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {req.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default CreatorDashboard;
