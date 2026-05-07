import { useState, useEffect, useCallback } from "react";
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
import { Save, Plus, Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

        {role === "admin" ? <AdminSettings /> : <PerformerSettings userId={user?.id} userEmail={user?.email} />}
      </motion.div>
    </DashboardLayout>
  );
};

/* ─── PERFORMER SETTINGS ─── */
const PerformerSettings = ({ userId, userEmail }: { userId?: string; userEmail?: string }) => {
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [profile, setProfile] = useState({
    legal_name: "",
    stage_name: "",
    bio: "",
    phone: "",
  });
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  const [notifs, setNotifs] = useState({
    scan_match: true,
    weekly_summary: true,
    dmca_updates: true,
    policy_changes: false,
  });
  const [hasNotifRow, setHasNotifRow] = useState(false);

  const [plan, setPlan] = useState<{ name: string; interval: string } | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      // Profile
      const { data: p } = await supabase
        .from("profiles")
        .select("legal_name, stage_name, bio, phone, imdb_url")
        .eq("user_id", userId)
        .maybeSingle();
      if (p) {
        setProfile({
          legal_name: p.legal_name || "",
          stage_name: p.stage_name || "",
          bio: p.bio || "",
          phone: p.phone || "",
        });
        setWebsite(p.imdb_url || "");
      }
      setEmail(userEmail || "");

      // Notification prefs
      const { data: n } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (n) {
        setNotifs({
          scan_match: n.scan_match,
          weekly_summary: n.weekly_summary,
          dmca_updates: n.dmca_updates,
          policy_changes: n.policy_changes,
        });
        setHasNotifRow(true);
      }

      // Subscription
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("plan_id, subscription_plans(name, interval)")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();
      if (sub && (sub as any).subscription_plans) {
        const sp = (sub as any).subscription_plans;
        setPlan({ name: sp.name, interval: sp.interval });
      }

      setLoading(false);
    })();
  }, [userId, userEmail]);

  const saveProfile = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        legal_name: profile.legal_name || null,
        stage_name: profile.stage_name || null,
        bio: profile.bio || null,
        phone: profile.phone || null,
        imdb_url: website || null,
      } as any)
      .eq("user_id", userId);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated" });
  }, [userId, profile, website, toast]);

  const saveNotifs = useCallback(async () => {
    if (!userId) return;
    setSavingNotifs(true);
    let error: any;
    if (hasNotifRow) {
      ({ error } = await supabase
        .from("notification_preferences")
        .update({ ...notifs })
        .eq("user_id", userId));
    } else {
      ({ error } = await supabase
        .from("notification_preferences")
        .insert({ user_id: userId, ...notifs }));
      if (!error) setHasNotifRow(true);
    }
    setSavingNotifs(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Notification preferences saved" });
  }, [userId, notifs, hasNotifRow, toast]);

  const handleDeleteAccount = useCallback(async () => {
    toast({ title: "Account deletion requested", description: "Please contact support to complete this process." });
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Section 1 — Profile Settings */}
      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="font-display">Profile Settings</CardTitle>
          <CardDescription>Update your performer profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legal Name</Label>
              <Input value={profile.legal_name} onChange={(e) => setProfile({ ...profile, legal_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Stage Name</Label>
              <Input value={profile.stage_name} onChange={(e) => setProfile({ ...profile, stage_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email is managed through your login account.</p>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website URL</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell us about yourself..." rows={3} />
          </div>
          <Button onClick={saveProfile} disabled={saving} className="font-display">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Section 2 — Notification Preferences */}
      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="font-display">Notification Preferences</CardTitle>
          <CardDescription>Choose what emails you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: "scan_match" as const, label: "Email me when a scan finds a match" },
            { key: "weekly_summary" as const, label: "Email me weekly scan summary" },
            { key: "dmca_updates" as const, label: "Email me DMCA status updates" },
            { key: "policy_changes" as const, label: "Email me platform policy changes" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <Label htmlFor={item.key} className="text-sm cursor-pointer flex-1">{item.label}</Label>
              <Switch
                id={item.key}
                checked={notifs[item.key]}
                onCheckedChange={(v) => setNotifs((n) => ({ ...n, [item.key]: v }))}
              />
            </div>
          ))}
          <Button onClick={saveNotifs} disabled={savingNotifs} variant="secondary" className="font-display">
            {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Section 3 — Subscription */}
      <Card className="glass-card border-border/30">
        <CardHeader>
          <CardTitle className="font-display">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Current Plan:</span>
            <Badge variant="outline" className="text-accent border-accent/40">
              {plan ? plan.name : "Free"}
            </Badge>
          </div>
          {plan && (
            <p className="text-sm text-muted-foreground">
              Billing cycle: <span className="text-foreground capitalize">{plan.interval}</span>
            </p>
          )}
          <Button variant="outline" className="font-display" asChild>
            <a href="#">Manage Billing</a>
          </Button>
        </CardContent>
      </Card>

      {/* Section 4 — Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="font-display text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="font-display">
                <AlertTriangle className="w-4 h-4 mr-2" /> Delete My Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account, all uploaded assets, scan history, certificates, and evidence packets. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
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
