import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Props {
  profile: any;
  onToggleDiscoverable: (value: boolean) => void;
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
    <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm text-foreground font-medium text-right">{value || "—"}</span>
  </div>
);

const linkify = (handle?: string | null, base?: string) => {
  if (!handle) return null;
  if (handle.startsWith("http")) return handle;
  if (base) return `${base}${handle.replace(/^@/, "")}`;
  return handle;
};

const ProfileSummary = ({ profile, onToggleDiscoverable }: Props) => {
  const links = [
    profile?.imdb_url && { label: "IMDb", url: profile.imdb_url },
    profile?.instagram_handle && {
      label: "Instagram",
      url: linkify(profile.instagram_handle, "https://instagram.com/"),
    },
    profile?.tiktok_handle && {
      label: "TikTok",
      url: linkify(profile.tiktok_handle, "https://tiktok.com/@"),
    },
    profile?.youtube_handle && {
      label: "YouTube",
      url: linkify(profile.youtube_handle, "https://youtube.com/@"),
    },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <section>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold">Your Profile</h2>
        <Button asChild size="sm" variant="outline">
          <Link to="/dashboard/profile">
            Edit Profile <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border/30 bg-card/40 p-5 space-y-1">
        <Row label="Name" value={profile?.legal_name || profile?.full_name} />
        <Row label="Stage Name" value={profile?.stage_name} />
        <Row label="Union" value={profile?.union_affiliation} />
        <Row label="Performance Type" value={profile?.performance_type} />
        <Row label="Primary Market" value={profile?.primary_market} />

        {links.length > 0 && (
          <div className="pt-3 border-t border-border/20 mt-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Links</div>
            <div className="flex flex-wrap gap-2">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/50 text-xs text-foreground hover:bg-secondary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> {l.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 mt-2 border-t border-border/20 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-foreground">Discoverable to industry</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified casting directors can find your profile.
            </p>
          </div>
          <Switch
            checked={!!profile?.is_discoverable}
            onCheckedChange={onToggleDiscoverable}
          />
        </div>
      </div>
    </section>
  );
};

export default ProfileSummary;
