import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Stamp, CheckCircle2, Clock, Circle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { key: "phrase", title: "Define Your Sound Mark", desc: "Record or confirm your unique signature phrase that audiences associate with you." },
  { key: "entity", title: "Establish Business Entity", desc: "Create or confirm a rights-management LLC that will own your trademarks." },
  { key: "search", title: "Trademark Search", desc: "We check existing USPTO filings to make sure your mark is available." },
  { key: "file", title: "File Application", desc: "Submit your trademark application through the USPTO TEAS system." },
];

const TrademarkKit = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("signature_phrase, trademark_entity, trademark_status, stage_name, legal_name, full_name").eq("user_id", user.id).maybeSingle();
      setProfile(data);
      setLoading(false);
    })();
  }, [user]);

  const status = profile?.trademark_status ?? "not_started";
  const completedIndex = status === "filed" ? 4 : status === "in_progress" ? 1 : 0;

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
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/dashboard/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="flex items-center gap-3">
          <Stamp className="w-8 h-8 text-accent" />
          <div>
            <h1 className="font-display text-3xl font-bold">Trademark Kit</h1>
            <p className="text-sm text-muted-foreground">Protect your name, likeness, and voice with a registered trademark.</p>
          </div>
        </div>

        {/* Current Info */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-lg font-semibold">Your Trademark Details</h2>
              <Badge
                variant="outline"
                className={
                  status === "filed" ? "bg-green-600/20 text-green-400 border-green-500/30" :
                  status === "in_progress" ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30" :
                  "text-muted-foreground"
                }
              >
                {status === "filed" ? "Filed" : status === "in_progress" ? "In Progress" : "Not Started"}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground">Signature Phrase</p>
                <p className="font-medium mt-1">{profile?.signature_phrase || <span className="text-muted-foreground italic">Not set — update in Profile</span>}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground">Business Entity</p>
                <p className="font-medium mt-1">{profile?.trademark_entity || <span className="text-muted-foreground italic">Not set — update in Profile</span>}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-1">
            <h2 className="font-display text-lg font-semibold mb-4">Filing Roadmap</h2>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i < completedIndex;
                const active = i === completedIndex;
                return (
                  <div key={step.key} className="flex gap-3 items-start">
                    <div className="mt-0.5">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : active ? (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${done ? "text-green-400" : active ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Coming soon:</strong> Automated trademark search and guided USPTO filing directly from your dashboard.
            For now, fill in your Signature Phrase and Business Entity on your{" "}
            <Link to="/dashboard/profile" className="text-primary hover:underline">Profile</Link> page to get started.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TrademarkKit;
