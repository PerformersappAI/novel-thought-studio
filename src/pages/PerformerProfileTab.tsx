import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Lock, RefreshCw, Shield, Stamp, ArrowRight, Mic, FileText, Camera, Upload, Users, Mail } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import CertificateCard from "@/components/dashboard/CertificateCard";

const UNIONS = ["Union Member", "Fi-Core", "Non-Union", "ACTRA", "Equity", "Other"];
const TYPES = ["Actor", "Voice Actor", "Musician", "Dancer", "Stunt Performer", "Model", "Content Creator", "Other"];
const YEARS = ["0-2", "3-5", "6-10", "10+"];
const MARKETS = ["Los Angeles", "New York", "Atlanta", "Chicago", "London", "Other"];
const PROFESSIONS = ["Actor", "Model", "Influencer", "CEO", "Executive", "Lawyer", "Doctor", "Athlete", "Musician", "Politician", "Public Figure", "Other"];

const PerformerProfileTab = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [registry, setRegistry] = useState<any>(null);
  const [savingRegistry, setSavingRegistry] = useState(false);
  // (face-capture thumbnails removed)
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const [voicePreview, setVoicePreview] = useState<string | null>(null);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const uploadHeadshot = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image too large (max 10MB)", variant: "destructive" });
      return;
    }
    setUploadingHeadshot(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/headshot-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("headshots").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingHeadshot(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    // Private bucket: store the storage path, render via signed URL.
    await supabase.from("profiles").update({ headshot_url: path } as any).eq("user_id", user.id);
    const { data: signed } = await supabase.storage.from("headshots").createSignedUrl(path, 3600);
    setHeadshotPreview(signed?.signedUrl ?? null);
    setUploadingHeadshot(false);
    toast({ title: "Headshot uploaded" });
  };

  const uploadVoice = async (file: File) => {
    if (!user) return;
    if (!/^audio\/(mpeg|mp3|wav|x-wav|wave)$/i.test(file.type) && !/\.(mp3|wav)$/i.test(file.name)) {
      toast({ title: "Use MP3 or WAV format", variant: "destructive" });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast({ title: "File too large (max 25MB)", variant: "destructive" });
      return;
    }
    setUploadingVoice(true);
    const ext = file.name.split(".").pop() || "mp3";
    const path = `${user.id}/voice_sample-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("voice-prints").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingVoice(false);
      toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
      return;
    }
    await supabase.from("profiles").update({ voice_print_url: path } as any).eq("user_id", user.id);
    const { data: signed } = await supabase.storage.from("voice-prints").createSignedUrl(path, 600);
    setVoicePreview(signed?.signedUrl ?? null);
    setUploadingVoice(false);
    toast({ title: "Voice sample uploaded" });
  };

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
        aka_names: Array.isArray(data?.aka_names) ? data.aka_names.join(", ") : "",
        is_discoverable: data?.is_discoverable ?? false,
        profession: data?.profession ?? "",
        signature_phrase: data?.signature_phrase ?? "",
        trademark_entity: data?.trademark_entity ?? "",
        writing_sample: data?.writing_sample ?? "",
      });
      if (data?.headshot_url) {
        const { resolveHeadshotUrl } = await import("@/lib/headshotUrl");
        setHeadshotPreview(await resolveHeadshotUrl(data.headshot_url));
      }
      if (data?.voice_print_url) {
        const { data: signedVoice } = await supabase.storage.from("voice-prints").createSignedUrl(data.voice_print_url, 600);
        setVoicePreview(signedVoice?.signedUrl ?? null);
      }

      const { data: reg } = await (supabase as any)
        .from("registry_performers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setRegistry(reg ?? {
        listed_on_registry: false,
        inquiry_goes_to: "actor",
        inquiry_email: user.email ?? "",
        rep_email: "",
        rep_name: "",
        cc_actor_on_inquiry: true,
      });

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
    const { aka_names, ...rest } = form;
    const akaArray = (aka_names || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const { error } = await supabase
      .from("profiles")
      .update({
        ...rest,
        aka_names: akaArray.length ? akaArray : null,
        profession: form.profession || null,
        writing_sample: form.writing_sample?.trim() || null,
        full_name: form.legal_name,
        bio: (form.bio || "").slice(0, 250) || null,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated" });
      if (form.profession && user.email) {
        supabase.functions.invoke("actor-sync-profession", {
          body: { email: user.email, profession: form.profession },
        }).catch(() => { /* non-blocking */ });
      }
    }
  };

  // descriptor preview removed

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
          <p className="text-sm text-muted-foreground">Manage your performer profile and headshot registration.</p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-xl font-semibold">Profile Details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Legal Name</Label><Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} /></div>
            <div className="space-y-2"><Label>Stage Name *</Label><Input required value={form.stage_name} onChange={(e) => update("stage_name", e.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Your Profession / How You're Known Online</Label>
              <Select value={form.profession || undefined} onValueChange={(v) => update("profession", v)}>
                <SelectTrigger><SelectValue placeholder="Select your profession" /></SelectTrigger>
                <SelectContent>{PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">This helps us find you more accurately across the web.</p>
            </div>
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
            <div className="sm:col-span-2 rounded-xl border border-border/60 bg-card/40 p-4 flex gap-3 items-start">
              <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                To find you accurately across the web, we need your real handles and names. We can only monitor platforms you're on — but we can also flag accounts on platforms you're NOT on that may be impersonating you. The more you fill in, the better we protect you. We never sell your data, share it, or use it to train AI. Ever.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Your Instagram Handle</Label>
              <LinkPreviewInput type="instagram" placeholder="@yourhandle" value={form.instagram_handle} onChange={(v) => update("instagram_handle", v)} />
            </div>
            <div className="space-y-2">
              <Label>Your TikTok Handle</Label>
              <LinkPreviewInput type="tiktok" placeholder="@yourhandle" value={form.tiktok_handle} onChange={(v) => update("tiktok_handle", v)} />
            </div>
            <div className="space-y-2">
              <Label>Your YouTube Channel</Label>
              <LinkPreviewInput type="youtube" placeholder="@yourchannel" value={form.youtube_handle} onChange={(v) => update("youtube_handle", v)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Known As / Nicknames</Label>
              <Input
                placeholder="Will Roberts, William Roberts, Wild Will"
                value={form.aka_names}
                onChange={(e) => update("aka_names", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma separated — every name people might know you by helps the scanner find you.</p>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-primary" /> Your Professional Headshot</Label>
              <p className="text-xs text-muted-foreground">Used to find unauthorized use of your image online.</p>
              <div className="flex items-center gap-4">
                {headshotPreview && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted/20 shrink-0">
                    <img src={headshotPreview} alt="Headshot" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingHeadshot}
                    onChange={(e) => e.target.files?.[0] && uploadHeadshot(e.target.files[0])}
                  />
                  <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/60 transition-colors">
                    {uploadingHeadshot ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" /> {headshotPreview ? "Replace headshot" : "Upload headshot"}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label className="flex items-center gap-2"><Mic className="w-4 h-4 text-primary" /> Your Voice Sample</Label>
              <p className="text-xs text-muted-foreground">Used to detect unauthorized voice clones. MP3 or WAV, under 2 minutes.</p>
              {voicePreview && (
                <audio controls src={voicePreview} className="w-full h-10" />
              )}
              <label className="block">
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav"
                  className="hidden"
                  disabled={uploadingVoice}
                  onChange={(e) => e.target.files?.[0] && uploadVoice(e.target.files[0])}
                />
                <div className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/60 transition-colors">
                  {uploadingVoice ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" /> {voicePreview ? "Replace voice sample" : "Upload voice sample"}
                    </p>
                  )}
                </div>
              </label>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Your Writing Sample</Label>
              <p className="text-xs text-muted-foreground">
                Used to detect plagiarism of your content. Minimum 100 words.{" "}
                <span className={((form.writing_sample || "").trim().split(/\s+/).filter(Boolean).length >= 100) ? "text-green-500" : "text-muted-foreground"}>
                  ({(form.writing_sample || "").trim().split(/\s+/).filter(Boolean).length} words)
                </span>
              </p>
              <Textarea
                rows={6}
                placeholder="Paste a sample of your writing here — a blog post, article, or social caption you've written."
                value={form.writing_sample || ""}
                onChange={(e) => update("writing_sample", e.target.value)}
              />
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
              <p>Your personal data and headshot are never shared — only your name, performance type, and market.</p>
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="font-display">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Headshot Registration
            </h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/onboarding/face-capture"><RefreshCw className="w-3.5 h-3.5 mr-1" /> Update Headshot</Link>
            </Button>
          </div>

          {headshotPreview ? (
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              <img
                src={headshotPreview}
                alt="Registered headshot"
                className="w-40 h-40 rounded-xl object-cover border-2 border-primary/30"
              />
              <div className="grid grid-cols-1 gap-3 text-sm flex-1">
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">Registered On</p>
                  <p className="font-mono">
                    {profile?.face_registered_at ? new Date(profile.face_registered_at).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">Reference URL</p>
                  <p className="font-mono text-xs break-all">{headshotPreview}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">You haven't uploaded a headshot yet.</p>
              <Button asChild><Link to="/onboarding/face-capture">Upload Headshot</Link></Button>
            </div>
          )}
        </div>

        {/* Ownership Certificate */}
        <CertificateCard profile={profile} />

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

          <Button
            className="font-display w-full sm:w-auto"
            onClick={async () => {
              if (!user) return;
              setSaving(true);
              const { error } = await supabase
                .from("profiles")
                .update({
                  signature_phrase: form.signature_phrase || null,
                  trademark_entity: form.trademark_entity || null,
                } as any)
                .eq("user_id", user.id);
              setSaving(false);
              if (error) {
                toast({ title: "Save failed", description: error.message, variant: "destructive" });
                return;
              }
              navigate("/dashboard/trademark");
            }}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start My Trademark Kit <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </div>

        <DashboardTrustFooter />
      </div>
    </DashboardLayout>
  );
};

export default PerformerProfileTab;
