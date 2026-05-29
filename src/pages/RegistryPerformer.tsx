import { useEffect, useState, FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Instagram,
  Globe,
  Film,
  Play,
  Sparkles,
  Users,
  Star,
  ShieldCheck,
  Mail,
  ArrowRight,
  User,
} from "lucide-react";

interface Performer {
  id: string;
  slug: string;
  stage_name: string;
  headshot_url: string | null;
  profession: string | null;
  union_status: string | null;
  bio: string | null;
  experience_level: string | null;
  rep_name: string | null;
  instagram_url: string | null;
  imdb_url: string | null;
  website_url: string | null;
  youtube_url: string | null;
  demo_reel_url: string | null;
  instagram_followers: number | null;
  tiktok_followers: number | null;
  youtube_subscribers: number | null;
  skills: string[] | null;
  verified_date: string | null;
  inquiry_goes_to: string | null;
}

const BG = "#12131a";
const GOLD = "#e6a800";

const fmtCount = (n: number | null) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

const youtubeEmbed = (url: string | null) => {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
};

const RegistryPerformer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [p, setP] = useState<Performer | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("registry_performers")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (data?.headshot_url) {
        data.headshot_url = await resolveHeadshotUrl(data.headshot_url);
      }
      setP(data);
      setLoading(false);
    })();
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!p) return;
    setSubmitting(true);
    const { error } = await (supabase as any).from("performer_inquiries").insert({
      performer_id: p.id,
      sender_name: form.name,
      sender_email: form.email,
      company: form.company,
      message: form.message,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not send inquiry", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inquiry sent", description: "Your message was delivered." });
    setForm({ name: "", email: "", company: "", message: "" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <p className="text-white/60 font-body animate-pulse">Loading…</p>
      </div>
    );
  }
  if (!p) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <p className="text-white/60 mb-4">Performer not found.</p>
          <Link to="/" className="underline" style={{ color: GOLD }}>Go home</Link>
        </div>
      </div>
    );
  }

  const totalReach =
    (p.instagram_followers ?? 0) + (p.tiktok_followers ?? 0) + (p.youtube_subscribers ?? 0);

  const embed = youtubeEmbed(p.demo_reel_url);

  return (
    <div className="min-h-screen text-white" style={{ background: BG }}>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Banner */}
        <header
          className="rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start"
          style={{ background: GOLD, color: "#1a1208" }}
        >
          <div className="w-24 h-24 rounded-full bg-black/15 flex items-center justify-center overflow-hidden flex-shrink-0">
            {p.headshot_url ? (
              <img src={p.headshot_url} alt={p.stage_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-black/40" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <h1 className="font-display text-3xl font-bold leading-tight">{p.stage_name}</h1>
            <div className="inline-flex items-center gap-2 bg-black/15 rounded-full px-3 py-1 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              ClaimMyFace Verified
              {p.verified_date && <> · Scanned {fmtDate(p.verified_date)}</>}
            </div>
            <div className="flex flex-wrap gap-2">
              {p.instagram_url && <LinkPill href={p.instagram_url} icon={<Instagram className="w-3.5 h-3.5" />} label="Instagram" />}
              {p.website_url && <LinkPill href={p.website_url} icon={<Globe className="w-3.5 h-3.5" />} label="Website" />}
              {p.imdb_url && <LinkPill href={p.imdb_url} icon={<Film className="w-3.5 h-3.5" />} label="IMDb" />}
              {p.youtube_url && <LinkPill href={p.youtube_url} icon={<Play className="w-3.5 h-3.5" />} label="YouTube" />}
            </div>
          </div>
        </header>

        {/* Highlights */}
        <Section icon={<Sparkles className="w-4 h-4" />} title="Highlights">
          <div className="flex flex-wrap gap-2 mb-4">
            {p.profession && <GoldPill>{p.profession}</GoldPill>}
            {p.union_status && <GoldPill>{p.union_status}</GoldPill>}
            {p.experience_level && <GoldPill>{p.experience_level}</GoldPill>}
            {p.rep_name && <GoldPill>Rep: {p.rep_name}</GoldPill>}
          </div>
          {p.bio && <p className="text-sm text-white/80 leading-relaxed font-body">{p.bio}</p>}
        </Section>

        {/* Demo Reel */}
        {p.demo_reel_url && (
          <Section icon={<Play className="w-4 h-4" />} title="Demo Reel">
            {embed ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <iframe
                  src={embed}
                  title="Demo reel"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                />
              </div>
            ) : (
              <a
                href={p.demo_reel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10 hover:border-white/20 transition"
              >
                <div
                  className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ background: GOLD }}
                >
                  <Play className="w-5 h-5 text-black fill-black" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.stage_name} — Demo Reel</p>
                  <p className="text-xs text-white/50 truncate">{p.demo_reel_url}</p>
                </div>
              </a>
            )}
          </Section>
        )}

        {/* Social */}
        {(p.instagram_followers || p.tiktok_followers || p.youtube_subscribers) ? (
          <Section icon={<Users className="w-4 h-4" />} title="Social & Influence">
            <div className="space-y-2">
              <StatCard label="Instagram" value={p.instagram_followers} />
              <StatCard label="TikTok" value={p.tiktok_followers} />
              <StatCard label="YouTube" value={p.youtube_subscribers} />
            </div>
            <div className="text-right mt-3">
              <p className="text-xs text-white/60">Total reach</p>
              <p className="font-display text-2xl font-bold" style={{ color: "#b794f4" }}>
                {fmtCount(totalReach)}
              </p>
            </div>
          </Section>
        ) : null}

        {/* Skills */}
        {p.skills && p.skills.length > 0 && (
          <Section icon={<Star className="w-4 h-4" />} title="Special Skills">
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-md text-xs font-body bg-white/[0.04] border border-white/10 text-white/80"
                >
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Verified */}
        <Section icon={<ShieldCheck className="w-4 h-4" />} title="ClaimMyFace Verified">
          <div className="rounded-lg p-4 border border-emerald-500/40 bg-emerald-500/[0.06] flex gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-emerald-300 mb-1">
                Identity verified &amp; monitored
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-body">
                No unauthorized deepfakes, voice clones, or fake profiles detected
                {p.verified_date && <> as of {fmtDate(p.verified_date)}</>}. Monitored
                continuously by ClaimMyFace.com. This is not a guarantee — it is a verified
                scan record.
              </p>
            </div>
          </div>
        </Section>

        {/* Inquiry */}
        <Section icon={<Mail className="w-4 h-4" />} title="Send an Inquiry">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              required
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"
            />
            <Input
              required
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"
            />
            <Input
              placeholder="Company / production / project"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"
            />
            <Textarea
              required
              rows={4}
              placeholder="Your message or inquiry…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/40"
            />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button
                type="submit"
                disabled={submitting}
                className="font-semibold text-black hover:opacity-90"
                style={{ background: GOLD }}
              >
                {submitting ? "Sending…" : "Send Inquiry"} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <p className="text-xs text-white/50">
                Sent directly to {p.inquiry_goes_to === "rep" ? "the rep's" : "actor's"} preferred contact
              </p>
            </div>
            <p className="text-xs text-white/40 pt-2 font-body">
              ClaimMyFace is not a talent agency and does not book engagements. This form routes
              to the performer or their designated representative.
            </p>
          </form>
        </Section>
      </div>
    </div>
  );
};

const Section = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl p-5 border border-white/5 bg-white/[0.02]">
    <h2 className="font-display font-semibold mb-4 flex items-center gap-2" style={{ color: GOLD }}>
      {icon}
      {title}
    </h2>
    {children}
  </section>
);

const GoldPill = ({ children }: { children: React.ReactNode }) => (
  <span
    className="px-3 py-1 rounded-full text-xs font-medium border"
    style={{ borderColor: GOLD, color: GOLD, background: "rgba(230,168,0,0.08)" }}
  >
    {children}
  </span>
);

const LinkPill = ({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 bg-[#1a1a22] text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-black transition"
  >
    {icon}
    {label}
  </a>
);

const StatCard = ({ label, value }: { label: string; value: number | null }) => (
  <div className="rounded-lg bg-white/[0.03] border border-white/5 px-5 py-4 text-center">
    <p className="font-display text-2xl font-bold">{fmtCount(value)}</p>
    <p className="text-xs text-white/50 mt-1">{label}</p>
  </div>
);

export default RegistryPerformer;
