import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TrustBanner from "@/components/onboarding/TrustBanner";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import LinkPreviewInput from "@/components/onboarding/LinkPreviewInput";

const UNIONS = ["SAG-AFTRA", "Fi-Core", "Non-Union", "ACTRA", "Equity", "Other"];
const TYPES = ["Actor", "Voice Actor", "Musician", "Dancer", "Stunt Performer", "Model", "Content Creator", "Other"];
const YEARS = ["0-2", "3-5", "6-10", "10+"];
const MARKETS = ["Los Angeles", "New York", "Atlanta", "Chicago", "London", "Other"];

const OnboardingProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headshotFile, setHeadshotFile] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    legal_name: "",
    stage_name: "",
    email: "",
    phone: "",
    union_affiliation: "Non-Union",
    performance_type: "Actor",
    years_performing: "0-2",
    primary_market: "Los Angeles",
    imdb_url: "",
    bio: "",
    agency_name: "",
    instagram_handle: "",
    tiktok_handle: "",
    youtube_handle: "",
    is_discoverable: false,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setForm((f) => ({
          ...f,
          legal_name: data.legal_name ?? data.full_name ?? "",
          stage_name: data.stage_name ?? "",
          email: user.email ?? "",
          phone: data.phone ?? "",
          union_affiliation: data.union_affiliation ?? "Non-Union",
          performance_type: data.performance_type ?? "Actor",
          years_performing: data.years_performing ?? "0-2",
          primary_market: data.primary_market ?? "Los Angeles",
          imdb_url: data.imdb_url ?? "",
          bio: data.bio ?? "",
          agency_name: data.agency_name ?? "",
          instagram_handle: data.instagram_handle ?? "",
          tiktok_handle: data.tiktok_handle ?? "",
          youtube_handle: data.youtube_handle ?? "",
          is_discoverable: data.is_discoverable ?? false,
        }));
        if (data.headshot_url) setHeadshotPreview(data.headshot_url);
      } else {
        setForm((f) => ({ ...f, email: user.email ?? "" }));
      }
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onHeadshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 8MB.", variant: "destructive" });
      return;
    }
    setHeadshotFile(file);
    setHeadshotPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    if (!user) return;
    if (!form.legal_name.trim()) {
      toast({ title: "Legal name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let headshot_url: string | undefined;
      if (headshotFile) {
        const ext = headshotFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/headshot-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("headshots")
          .upload(path, headshotFile, { upsert: true, contentType: headshotFile.type });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("headshots").getPublicUrl(path);
        headshot_url = pub.publicUrl;
      }

      const payload: any = {
        legal_name: form.legal_name.trim(),
        full_name: form.legal_name.trim(),
        stage_name: form.stage_name.trim() || null,
        phone: form.phone.trim() || null,
        union_affiliation: form.union_affiliation,
        performance_type: form.performance_type,
        years_performing: form.years_performing,
        primary_market: form.primary_market,
        imdb_url: form.imdb_url.trim() || null,
        bio: form.bio.slice(0, 250) || null,
        agency_name: form.agency_name.trim() || null,
        instagram_handle: form.instagram_handle.trim() || null,
        tiktok_handle: form.tiktok_handle.trim() || null,
        youtube_handle: form.youtube_handle.trim() || null,
        is_discoverable: form.is_discoverable,
      };
      if (headshot_url) payload.headshot_url = headshot_url;

      const { error } = await supabase.from("profiles").update(payload).eq("user_id", user.id);
      if (error) throw error;

      toast({ title: "Profile saved" });
      navigate("/onboarding/face-capture");
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 space-y-6">
        <OnboardingProgress step={1} />
        <TrustBanner />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <header>
            <h1 className="font-display text-3xl font-bold">Your Performer Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              The foundation of your registered identity. All fields private unless you opt in to discoverability.
            </p>
          </header>

          {/* Headshot */}
          <div className="space-y-2">
            <Label>Your Professional Headshot</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/30 border border-border overflow-hidden flex items-center justify-center">
                {headshotPreview ? (
                  <img src={headshotPreview} alt="Headshot" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <Input type="file" accept="image/*" onChange={onHeadshot} className="max-w-xs" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Legal Name *</Label>
              <Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Stage / Performer Name</Label>
              <Input value={form.stage_name} onChange={(e) => update("stage_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Union Status</Label>
              <Select value={form.union_affiliation} onValueChange={(v) => update("union_affiliation", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIONS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Performance Type</Label>
              <Select value={form.performance_type} onValueChange={(v) => update("performance_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Years Performing</Label>
              <Select value={form.years_performing} onValueChange={(v) => update("years_performing", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary Market</Label>
              <Select value={form.primary_market} onValueChange={(v) => update("primary_market", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MARKETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Website or IMDb URL</Label>
              <Input
                placeholder="https://imdb.com/name/..."
                value={form.imdb_url}
                onChange={(e) => update("imdb_url", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Bio <span className="text-muted-foreground text-xs">({form.bio.length}/250)</span></Label>
              <Textarea
                value={form.bio}
                maxLength={250}
                onChange={(e) => update("bio", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Agency / Manager (optional)</Label>
              <Input value={form.agency_name} onChange={(e) => update("agency_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input placeholder="@handle" value={form.instagram_handle} onChange={(e) => update("instagram_handle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>TikTok</Label>
              <Input placeholder="@handle" value={form.tiktok_handle} onChange={(e) => update("tiktok_handle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input placeholder="@handle" value={form.youtube_handle} onChange={(e) => update("youtube_handle", e.target.value)} />
            </div>
          </div>

          {/* Discoverability opt-in */}
          <div className="rounded-xl border border-primary/30 bg-card/40 p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">Make my profile discoverable to verified industry professionals</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  When enabled, casting directors and brands can find your verified profile. You control all
                  contact — they reach you by email or through your agent. You can turn this off at any time.
                </p>
              </div>
              <Switch
                checked={form.is_discoverable}
                onCheckedChange={(v) => update("is_discoverable", v)}
              />
            </div>
            <div className="flex gap-2 items-start text-xs text-muted-foreground border-t border-border/40 pt-3">
              <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p>Your personal data and face captures are never shared — only your name, performance type, and market.</p>
            </div>
          </div>

          {/* Security reassurance */}
          <div className="rounded-xl border border-border/60 bg-card/40 p-4 flex gap-3 items-start">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              🔒 Your profile information is encrypted with AES-256 and stored in a SOC 2 compliant database.
              It is never sold to third parties, never used to train AI models, and never shared without your
              explicit written consent.
            </p>
          </div>

          <Button onClick={submit} disabled={saving} size="lg" className="w-full font-display">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save Profile & Continue <ArrowRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default OnboardingProfile;
