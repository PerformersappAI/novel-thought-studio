import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, ImageIcon } from "lucide-react";
import { resolveHeadshotUrl } from "@/lib/headshotUrl";

interface Props {
  headshotUrl?: string | null;
  registryId?: string | null;
  registeredAt?: string | null;
  /** legacy prop — ignored */
  thumbs?: any;
}

const FacePanel = ({ headshotUrl, registryId, registeredAt }: Props) => {
  const [resolved, setResolved] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    resolveHeadshotUrl(headshotUrl).then((u) => { if (!cancelled) setResolved(u); });
    return () => { cancelled = true; };
  }, [headshotUrl]);
  return (
    <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-card to-card/70 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Headshot Registration</p>
          <h3 className="font-display text-lg">Your reference photo</h3>
        </div>
        {headshotUrl && (
          <Button size="sm" variant="ghost" asChild>
            <Link to="/onboarding/face-capture">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Update headshot
            </Link>
          </Button>
        )}
      </div>

      {headshotUrl ? (
        <div className="flex gap-4 items-center">
          <img
            src={resolved ?? undefined}
            alt="Uploaded headshot"
            className="w-24 h-24 rounded-xl object-cover border-2 border-accent/40 bg-muted"
          />

          <div className="text-xs space-y-1">
            {registryId && (
              <div>
                <p className="text-muted-foreground uppercase tracking-wider">Registry ID</p>
                <p className="font-mono text-foreground">{registryId}</p>
              </div>
            )}
            {registeredAt && (
              <div>
                <p className="text-muted-foreground uppercase tracking-wider">Registered</p>
                <p className="font-mono text-foreground">{new Date(registeredAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-6 space-y-3 border-2 border-dashed border-border rounded-xl">
          <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">No headshot uploaded yet.</p>
          <Button asChild size="sm">
            <Link to="/onboarding/face-capture">
              <Camera className="w-3.5 h-3.5 mr-1" /> Upload Headshot
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default FacePanel;
