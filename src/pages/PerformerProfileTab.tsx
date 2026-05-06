import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Lock, RefreshCw, Shield, Stamp, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TrustBanner from "@/components/onboarding/TrustBanner";
import DashboardTrustFooter from "@/components/dashboard/DashboardTrustFooter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LinkPreviewInput from "@/components/onboarding/LinkPreviewInput";

const UNIONS = ["SAG-AFTRA", "Fi-Core", "Non-Union", "ACTRA", "Equity", "Other"];
const TYPES = ["Actor", "Voice Actor", "Musician", "Dancer", "Stunt Performer", "Model", "Content Creator", "Other"];
const YEARS = ["0-2", "3-5", "6-10", "10+"];
const MARKETS = ["Los Angeles", "New York", "Atlanta", "Chicago", "London", "Other"];

const PerformerProfileTab = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [thumbs, setThumbs] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(data);
      setForm({
        legal_name: data?.legal_name ?? data?.full_name ?? "",
        stage_name: data?.stage_name ?? "",
        phone: data?.phone ?? "",
        union_affiliation: data?.union_affiliation ?? "Non-Union",
        performance_type: data?.performance_type ?? "Actor",
        years_performing: data?.years_performing ?? "0-2",
        primary_market: data?.primary_market ?? "Los Angeles",
        imdb_url: data?.imdb_url ?? "",
        bio: data?.bio ?? "",
        agency_name: data?.agency_name ?? "",
        instagram_handle: data?.instagram_handle ?? "",
        tiktok_handle: data?.tiktok_handle ?? "",
        youtube_handle: data?.youtube_handle ?? "",
        is_discoverable: data?.is_discoverable ?? false,
        signature_phrase: data?.signature_phrase ?? "",
        trademark_entity: data?.trademark_entity ?? "",
      });

      const paths = [data?.face_capture_front_url, data?.face_capture_left_url, data?.face_capture_right_url].filter(Boolean) as string[];
      if (paths.length) {
        const { data: signed } = await supabase.storage.from("face-captures").createSignedUrls(paths, 60 * 10);
        setThumbs((signed ?? []).map((s) => s.signedUrl).filter(Boolean) as string[]);
      }
      setLoading(false);
    })();
  }, [user]);

  const update = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!user) return;
    if (!form.legal_name?.trim()) {
      toast({ title: "Legal name required", variant: "destructive" });
      return;
    }
    if (!form.stage_name?.trim()) {
      toast({ title: "Stage name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        ...form,
        full_name: form.legal_name,
        bio: (form.bio || "").slice(0, 250) || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
    }
  };

  const descriptorPreview = (() => {
    const d = profile?.face_descriptor as number[] | undefined;
    if (!d || !Array.isArray(d)) return "[ not yet registered ]";
    return "[" + d.slice(0, 6).map((n) => n.toFixed(2)).join(", ") + "…]";
  })();

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
      <div className="max-w-4xl mx-auto space-y-6">
        <TrustBanner />

        <div>
          <h1 className="font-display text-3xl font-bold">Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your performer profile and face registration.</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-xl font-semibold">Profile Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Legal Name</Label><Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Stage Name *</Label><Input required value={form.stage_name} onChange={(e) => update("stage_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Union Status</Label>
              <Select value={form.union_affiliation} onValueChange={(v) => update("union_affiliation", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Performance Type</Label>
              <Select value={form.performance_type} onValueChange={(v) => update("performance_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Years Performing</Label>
              <Select value={form.years_performing} onValueChange={(v) => update("years_performing", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Market</Label>
              <Select value={form.primary_market} onValueChange={(v) => update("primary_market", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MARKETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website / IMDb</Label>
              <LinkPreviewInput type="imdb" value={form.imdb_url} onChange={(v) => update("imdb_url", v)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Bio <span className="text-xs text-muted-foreground">({(form.bio || "").length}/250)</span></Label>
              <Textarea maxLength={250} value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Agency / Manager Website</Label>
              <LinkPreviewInput type="url" placeholder="agency.com" value={form.agency_name} onChange={(v) => update("agency_name", v)} />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <LinkPreviewInput type="instagram" placeholder="@handle" value={form.instagram_handle} onChange={(v) => update("instagram_handle", v)} />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <LinkPreviewInput type="tiktok" placeholder="@handle" value={form.tiktok_handle} onChange={(v) => update("tiktok_handle", v)} />
            </div>
            <div className="space-y-2">
              <Label>YouTube</Label>
              <LinkPreviewInput type="youtube" placeholder="@handle" value={form.youtube_handle} onChange={(v) => update("youtube_handle", v)} />
            </div>
          </div>

          <div className="rounded-xl border border-primary/30 bg-card/40 p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">Make my profile discoverable to verified industry professionals</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  When enabled, casting directors and brands can find your verified profile. You control all
                  contact — they reach you by email or through your agent. You can turn this off at any time.
                </p>
              </div>
              <Switch checked={form.is_discoverable} onCheckedChange={(v) => update("is_discoverable", v)} />
            </div>
            <div className="flex gap-2 items-start text-xs text-muted-foreground border-t border-border/40 pt-3">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p>Your personal data and face captures are never shared — only your name, performance type, and market.</p>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="font-display">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Face Registration
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/onboarding/face-capture"><RefreshCw className="w-3.5 h-3.5 mr-1" /> Update Face Registration</Link>
            </Button>
          </div>

          {profile?.face_registered_at ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {thumbs.map((url, i) => (
                  <div key={i} className="space-y-1">
                    <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/20">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      {new Date(profile.face_registered_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">Registered On</p>
                  <p className="font-mono">{new Date(profile.face_registered_at).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">Face Hash</p>
                  <p className="font-mono text-xs break-all">{descriptorPreview}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Registration History</p>
                <div className="border-l-2 border-primary/40 pl-4 space-y-2">
                  <div>
                    <p className="text-sm">Face baseline registered</p>
                    <p className="text-xs text-muted-foreground">{new Date(profile.face_registered_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">You haven't registered your face yet.</p>
              <Button asChild><Link to="/onboarding/face-capture">Start Face Registration</Link></Button>
            </div>
          )}
        </div>

        {/* Trademark Protection */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Stamp className="w-5 h-5 text-accent" /> Trademark Protection
            </h2>
            <Badge
              variant={
                profile?.trademark_status === "filed" ? "default" :
                profile?.trademark_status === "in_progress" ? "secondary" : "outline"
              }
              className={
                profile?.trademark_status === "filed" ? "bg-green-600/20 text-green-400 border-green-500/30" :
                profile?.trademark_status === "in_progress" ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30" :
                "text-muted-foreground"
              }
            >
              {profile?.trademark_status === "filed" ? "Filed" :
               profile?.trademark_status === "in_progress" ? "In Progress" : "Not Started"}
            </Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label>Signature Phrase (Sound Mark)</Label>
              <Input
                placeholder={`Hey it's ${form.stage_name || form.legal_name || "[Your Name]"}`}
                value={form.signature_phrase}
                onChange={(e) => update("signature_phrase", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Your unique catchphrase that identifies you — this becomes your registered sound mark.</p>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Business Entity Name</Label>
              <Input
                placeholder={`${form.stage_name || form.legal_name || "[Name]"} Rights Management LLC`}
                value={form.trademark_entity}
                onChange={(e) => update("trademark_entity", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">The legal entity that will own your trademark filing.</p>
            </div>
          </div>

          <Button asChild className="font-display w-full sm:w-auto">
            <Link to="/dashboard/trademark">
              Start My Trademark Kit <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>

        <DashboardTrustFooter />
      </div>
    </DashboardLayout>
  );
};

export default PerformerProfileTab;
