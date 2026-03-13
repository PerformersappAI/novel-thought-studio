import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";

const Settings = () => {
  const { user, role } = useAuth();

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            {role === "admin" ? "Manage platform settings" : "Manage your account"}
          </p>
        </div>

        {role === "admin" ? <AdminSettings /> : <PerformerSettings userId={user?.id} />}
      </motion.div>
    </DashboardLayout>
  );
};

/* ─── PERFORMER SETTINGS ─── */
const PerformerSettings = ({ userId }: { userId?: string }) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({ full_name: "", display_name: "", bio: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data) setProfile({ full_name: data.full_name || "", display_name: data.display_name || "", bio: data.bio || "", phone: data.phone || "" });
    });
  }, [userId]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("user_id", userId);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: "Profile updated." });
  };

  return (
    <Card className="glass-card border-border/30 max-w-2xl">
      <CardHeader>
        <CardTitle className="font-display">Profile Settings</CardTitle>
        <CardDescription>Update your performer profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="Stage name (optional)" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
        </div>
        <Button onClick={save} disabled={saving} className="font-display">
          <Save className="w-4 h-4 mr-1" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ─── ADMIN SETTINGS ─── */
const AdminSettings = () => {
  return (
    <Tabs defaultValue="plans" className="max-w-4xl">
      <TabsList className="mb-6">
        <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
        <TabsTrigger value="legal">Legal Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="plans"><PlanManager /></TabsContent>
      <TabsContent value="legal"><LegalDocManager /></TabsContent>
    </Tabs>
  );
};

/* ─── PLAN MANAGER ─── */
const PlanManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const fetchPlans = async () => {
    const { data } = await supabase.from("subscription_plans").select("*").order("price_cents");
    setPlans(data ?? []);
  };

  useEffect(() => { fetchPlans(); }, []);

  const savePlan = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    let error;
    if (id) {
      ({ error } = await supabase.from("subscription_plans").update(rest).eq("id", id));
    } else {
      ({ error } = await supabase.from("subscription_plans").insert(rest));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setEditing(null); fetchPlans(); }
  };

  const deletePlan = async (id: string) => {
    await supabase.from("subscription_plans").update({ is_active: false }).eq("id", id);
    toast({ title: "Plan deactivated" });
    fetchPlans();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Subscription Plans</h3>
        <Button size="sm" onClick={() => setEditing({ name: "", description: "", price_cents: 0, interval: "monthly", is_active: true, features: [] })} className="font-display">
          <Plus className="w-4 h-4 mr-1" /> Add Plan
        </Button>
      </div>

      {editing && (
        <Card className="glass-card border-border/30 glow-blue">
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price (cents)</Label>
                <Input type="number" value={editing.price_cents} onChange={(e) => setEditing({ ...editing, price_cents: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="flex items-center gap-4">
              <Label>Interval:</Label>
              <select className="bg-secondary text-foreground rounded px-3 py-1.5 text-sm border border-border" value={editing.interval} onChange={(e) => setEditing({ ...editing, interval: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
              <div className="flex items-center gap-2 ml-auto">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={savePlan} className="font-display"><Save className="w-4 h-4 mr-1" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {plans.map((plan) => (
        <Card key={plan.id} className="glass-card border-border/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="font-display font-semibold text-foreground">{plan.name}</div>
              <div className="text-sm text-muted-foreground">
                ${(plan.price_cents / 100).toFixed(2)} / {plan.interval}
                {!plan.is_active && <Badge variant="secondary" className="ml-2 text-destructive">Inactive</Badge>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(plan)}>Edit</Button>
              <Button size="sm" variant="outline" onClick={() => deletePlan(plan.id)}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ─── LEGAL DOC MANAGER ─── */
const LegalDocManager = () => {
  const { toast } = useToast();
  const [docs, setDocs] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const fetchDocs = async () => {
    const { data } = await supabase.from("legal_documents").select("*").order("created_at", { ascending: false });
    setDocs(data ?? []);
  };

  useEffect(() => { fetchDocs(); }, []);

  const saveDoc = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    let error;
    if (id) {
      ({ error } = await supabase.from("legal_documents").update(rest).eq("id", id));
    } else {
      ({ error } = await supabase.from("legal_documents").insert(rest));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setEditing(null); fetchDocs(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Legal Documents</h3>
        <Button size="sm" onClick={() => setEditing({ title: "", document_type: "terms", content: "", version: 1, is_active: true })} className="font-display">
          <Plus className="w-4 h-4 mr-1" /> Add Document
        </Button>
      </div>

      {editing && (
        <Card className="glass-card border-border/30 glow-blue">
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input value={editing.document_type} onChange={(e) => setEditing({ ...editing, document_type: e.target.value })} placeholder="terms, privacy, consent..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={8} />
            </div>
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                <Input type="number" value={editing.version} onChange={(e) => setEditing({ ...editing, version: parseInt(e.target.value) || 1 })} className="w-24" />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveDoc} className="font-display"><Save className="w-4 h-4 mr-1" /> Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {docs.map((doc) => (
        <Card key={doc.id} className="glass-card border-border/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="font-display font-semibold text-foreground">{doc.title}</div>
              <div className="text-sm text-muted-foreground">
                v{doc.version} · {doc.document_type}
                {!doc.is_active && <Badge variant="secondary" className="ml-2 text-destructive">Inactive</Badge>}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(doc)}>Edit</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Settings;
