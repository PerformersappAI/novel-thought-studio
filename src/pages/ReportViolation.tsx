import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ReportViolation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [violations, setViolations] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchViolations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reported_violations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setViolations(data ?? []);
  };

  useEffect(() => { fetchViolations(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const path = `${user.id}/violations/${Date.now()}-${screenshot.name}`;
        const { error: upErr } = await supabase.storage.from("assets").upload(path, screenshot);
        if (upErr) throw upErr;
        screenshotUrl = path;
      }

      const { error } = await supabase.from("reported_violations").insert({
        user_id: user.id,
        url,
        description,
        screenshot_url: screenshotUrl,
      } as any);
      if (error) throw error;
      toast({ title: "Report submitted", description: "We'll investigate this violation." });
      setShowForm(false);
      setUrl("");
      setDescription("");
      setScreenshot(null);
      fetchViolations();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const statusColors: Record<string, string> = {
    open: "bg-accent/10 text-accent",
    investigating: "bg-primary/10 text-primary",
    resolved: "bg-primary/20 text-primary",
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Report Violations</h1>
            <p className="text-muted-foreground mt-1">Submit infringement reports for unauthorized use of your likeness</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="font-display">
            <Plus className="w-4 h-4 mr-1" /> New Report
          </Button>
        </div>

        {showForm && (
          <Card className="glass-card border-border/30 mb-8 glow-blue">
            <CardHeader>
              <CardTitle className="font-display text-lg">Submit Violation Report</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Infringing URL</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/infringing-content" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe how your likeness is being used without authorization..." rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label>Screenshot (optional)</Label>
                  <Input ref={fileRef} type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={submitting} className="font-display">
                    {submitting ? "Submitting..." : "Submit Report"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {violations.length === 0 ? (
            <Card className="glass-card border-border/30">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No violation reports yet.</p>
              </CardContent>
            </Card>
          ) : (
            violations.map((v) => (
              <Card key={v.id} className="glass-card border-border/30">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 shrink-0 text-muted-foreground" />
                        <a href={v.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">{v.url}</a>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{v.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(v.created_at).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="secondary" className={statusColors[v.status] || ""}>{v.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default ReportViolation;
