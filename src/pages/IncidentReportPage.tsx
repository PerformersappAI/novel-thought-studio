import { useEffect, useState, useCallback } from "react";
import { AlertTriangle, Loader2, Upload, Send } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = ["YouTube", "Instagram", "TikTok", "Facebook", "X/Twitter", "LinkedIn", "OnlyFans", "Fiverr", "Other"];
const VIOLATION_TYPES = ["Unauthorized face use", "AI voice clone", "Deepfake", "Unauthorized name use", "Other"];

const statusBadge = (status: string) => {
  switch (status) {
    case "resolved":
      return <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Resolved</Badge>;
    case "in_review":
      return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">In Review</Badge>;
    default:
      return <Badge className="bg-red-600/20 text-red-400 border-red-500/30">Open</Badge>;
  }
};

const IncidentReportPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    platform: "",
    infringing_url: "",
    violation_type: "",
    description: "",
  });

  const fetchReports = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("incident_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSubmit = useCallback(async () => {
    if (!user) return;
    if (!form.platform || !form.infringing_url.trim() || !form.violation_type) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    let evidenceUrl: string | null = null;

    // Upload evidence file if provided
    if (file) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("incident-evidence")
        .upload(path, file);
      if (uploadErr) {
        toast({ title: "Evidence upload failed", description: uploadErr.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("incident-evidence").getPublicUrl(path);
      evidenceUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("incident_reports").insert({
      user_id: user.id,
      platform: form.platform,
      infringing_url: form.infringing_url.trim(),
      violation_type: form.violation_type,
      description: form.description.trim(),
      evidence_url: evidenceUrl,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Incident report submitted" });
      setForm({ platform: "", infringing_url: "", violation_type: "", description: "" });
      setFile(null);
      fetchReports();
    }
  }, [user, form, file, toast, fetchReports]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <h1 className="font-display text-3xl font-bold">Report Violation</h1>
        </div>

        {/* Section 1 — Form */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-5">
            <h2 className="font-display text-lg font-semibold">File an Incident Report</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Platform *</Label>
                <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Type of Violation *</Label>
                <Select value={form.violation_type} onValueChange={(v) => setForm((f) => ({ ...f, violation_type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {VIOLATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>URL of Infringing Content *</Label>
                <Input
                  placeholder="https://..."
                  value={form.infringing_url}
                  onChange={(e) => setForm((f) => ({ ...f, infringing_url: e.target.value }))}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the violation..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Screenshot Evidence (optional)</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-card/40 text-sm cursor-pointer hover:bg-secondary/50 transition-colors">
                    <Upload className="w-4 h-4" />
                    {file ? file.name : "Choose file"}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {file && (
                    <button onClick={() => setFile(null)} className="text-xs text-muted-foreground hover:text-foreground">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={submitting} className="font-display">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Report
            </Button>
          </CardContent>
        </Card>

        {/* Section 2 — History */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold">Your Reports</h2>

            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports filed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-sm">{r.platform}</TableCell>
                        <TableCell className="text-sm">{r.violation_type}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IncidentReportPage;
