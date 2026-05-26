import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { ShieldCheck, ExternalLink, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface Item {
  key: string;
  title: string;
  description: string;
  link: string;
  external?: boolean;
  locked?: boolean;
}

const ITEMS: Item[] = [
  { key: "register_face", title: "Register your face with ClaimMyFace", description: "Your reference face is hashed and certified.", link: "/dashboard/certificate", locked: true },
  { key: "uspto_trademark", title: "Register your name as a trademark with the USPTO", description: "Protect your stage name as intellectual property.", link: "https://www.uspto.gov/trademarks/apply", external: true },
  { key: "dmca_agent", title: "File a DMCA agent registration with the US Copyright Office", description: "Required to receive takedown notices on your behalf.", link: "https://www.copyright.gov/dmca-directory/", external: true },
  { key: "site_copyright", title: "Add a copyright notice to your personal website", description: "© Your Name [Year] — All rights reserved.", link: "/education", external: false },
  { key: "watermark_headshots", title: "Watermark all your professional headshots", description: "Download protected versions from your certificate page.", link: "/dashboard/certificate" },
  { key: "google_alerts", title: "Set up Google Alerts for your name", description: "Get notified when your name appears online.", link: "https://www.google.com/alerts", external: true },
  { key: "social_verified", title: "Verify or lock down your social media accounts", description: "Verified handles and private accounts reduce impersonation risk.", link: "/education" },
  { key: "voice_soundmark", title: "Register your voice as a sound mark", description: "USPTO sound mark protects your distinctive voice.", link: "https://www.uspto.gov/trademarks/basics/trademark-sound-mark-examples", external: true },
  { key: "document_credits", title: "Document all your existing credits and performances", description: "Build a dated record of your professional work.", link: "/dashboard/profile" },
  { key: "ai_rights_statement", title: "Create an AI Usage Rights statement", description: "Declare what AI can and cannot do with your likeness.", link: "/dashboard/ai-rights" },
];

const SecureChecklist = () => {
  const { user } = useAuth();
  const [completed, setCompleted] = useState<Set<string>>(new Set(["register_face"]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("identity_checklist")
        .select("item_key")
        .eq("user_id", user.id);
      const set = new Set<string>(["register_face"]);
      (data || []).forEach((r: any) => set.add(r.item_key));
      setCompleted(set);
      setLoading(false);
    })();
  }, [user]);

  const toggle = async (item: Item) => {
    if (item.locked || !user) return;
    const next = new Set(completed);
    if (next.has(item.key)) {
      next.delete(item.key);
      setCompleted(next);
      await supabase.from("identity_checklist").delete().eq("user_id", user.id).eq("item_key", item.key);
    } else {
      next.add(item.key);
      setCompleted(next);
      await supabase.from("identity_checklist").insert({ user_id: user.id, item_key: item.key });
    }
  };

  const done = ITEMS.filter((i) => completed.has(i.key)).length;
  const pct = Math.round((done / ITEMS.length) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Post-Registration</p>
          <h1 className="font-display text-3xl sm:text-4xl">Secure Your Identity</h1>
          <p className="text-muted-foreground">
            Ten actions to lock down your name, face, and voice across the open internet.
          </p>
        </div>

        <Card className="p-5 bg-gradient-to-br from-[#0B1526] to-[#142340] border-accent/30">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm font-medium">{done} of {ITEMS.length} complete</span>
            <span className="text-accent font-display text-xl">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </Card>

        <div className="space-y-3">
          {ITEMS.map((item, idx) => {
            const isDone = completed.has(item.key);
            return (
              <Card
                key={item.key}
                className={`p-4 transition-colors ${isDone ? "border-emerald-500/40 bg-emerald-500/5" : "hover:border-accent/40"}`}
              >
                <div className="flex items-start gap-4">
                  <div className="pt-0.5">
                    {item.locked ? (
                      <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    ) : (
                      <Checkbox checked={isDone} onCheckedChange={() => toggle(item)} disabled={loading} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
                      {idx + 1}. {item.title}
                      {item.locked && <span className="ml-2 text-xs text-emerald-400">DONE</span>}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                  {item.external ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0">
                      Learn more <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link to={item.link} className="text-xs text-primary hover:underline shrink-0">
                      Learn more →
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" /> Your progress is private and stored securely.
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SecureChecklist;
