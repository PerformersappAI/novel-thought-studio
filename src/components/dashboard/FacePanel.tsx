import { Link } from "react-router-dom";
import { RefreshCw, ScanFace } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  thumbs: string[];
  registryId?: string | null;
  registeredAt?: string | null;
}

const labels = ["Front", "Left Profile", "Right Profile"];

const FacePanel = ({ thumbs, registryId, registeredAt }: Props) => {
  return (
    <section>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="font-display text-xl md:text-2xl font-bold">Your Registered Face</h2>
        {registeredAt && (
          <Button asChild size="sm" variant="outline">
            <Link to="/onboarding/face-capture">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Update Face Registration
            </Link>
          </Button>
        )}
      </div>

      {registeredAt ? (
        <div className="rounded-xl border border-border/30 bg-card/40 p-5">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <div className="aspect-square rounded-lg overflow-hidden border border-border/40 bg-muted/20">
                  {thumbs[i] ? (
                    <img src={thumbs[i]} alt={labels[i]} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ScanFace className="w-6 h-6 opacity-40" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">{labels[i]}</p>
                <p className="text-[10px] text-muted-foreground/70 text-center font-mono">
                  {new Date(registeredAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          {registryId && (
            <div className="mt-4 pt-4 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between">
              <span>Registry ID</span>
              <span className="font-mono text-foreground">{registryId}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/50 p-8 text-center bg-card/20">
          <ScanFace className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            You haven't registered your face yet.
          </p>
          <Button asChild>
            <Link to="/onboarding/face-capture">Start Face Registration</Link>
          </Button>
        </div>
      )}
    </section>
  );
};

export default FacePanel;
