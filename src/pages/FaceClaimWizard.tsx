import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Lock, CheckCircle, Wand2, FileText } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ASSET_OPTIONS = ["Face Photo", "Voice Recording", "Full Video", "Name & Image"];
const PLATFORMS = ["TikTok", "Instagram", "Facebook", "YouTube", "X / Twitter", "Stock Site", "Other"];
const ACTIONS = ["DMCA Takedown", "Cease & Desist", "Platform Report", "All Three"];

const FaceClaimWizard = () => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [step, setStep] = useState(1);
  const [assetType, setAssetType] = useState("");
  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");
  const [action, setAction] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
      .then(({ data }) => setIsPro(!!data));
  }, [user]);

  const generate = async () => {
    if (!user) {
      toast.error("Please sign in.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("face-claim-wizard", {
        body: { assetType, platform, url, action },
      });
      if (error) throw error;
      setOutput(data?.document ?? "");
      toast.success("Document generated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isPro) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container px-4 pt-24 pb-16 max-w-3xl">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Tools</Link>
          </Button>
          <Card className="border-2 border-[#C0392B] bg-gradient-to-br from-[#C0392B]/10 via-transparent to-transparent">
            <CardContent className="p-10 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#C0392B] flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h1 className="font-display text-2xl font-bold">Face Claim Wizard — Pro</h1>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                Generate DMCA takedowns, cease & desist letters, and platform reports — all pre-filled with your registered face data, in a 3-step guided flow.
              </p>
              <Link to="/#pricing">
                <Button className="mt-6 bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
                  Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Tools</Link>
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C0392B]/10 border border-[#C0392B]/30 mb-3">
              <Wand2 className="w-3.5 h-3.5 text-[#C0392B]" />
              <span className="text-xs text-[#C0392B] font-medium">Pro Tool</span>
            </div>
            <h1 className="font-display text-3xl font-bold">Face Claim Wizard</h1>
            <p className="text-muted-foreground mt-2">3 steps to your legal documents.</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                  step >= n ? "bg-[#C0392B] text-white" : "bg-secondary text-muted-foreground"
                }`}>{n}</div>
                {n < 3 && <div className={`w-12 h-0.5 ${step > n ? "bg-[#C0392B]" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <Card className="glass-card border-border/30">
            <CardContent className="p-6 md:p-8">
              {step === 1 && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-4">What was used without permission?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {ASSET_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAssetType(opt)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          assetType === opt ? "border-[#C0392B] bg-[#C0392B]/10" : "border-border/30 hover:border-border"
                        }`}
                      >
                        <div className="font-medium text-foreground">{opt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Where did you find it?</h2>
                  <div>
                    <Label>Platform</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {PLATFORMS.map((p) => (
                        <button
                          key={p}
                          onClick={() => setPlatform(p)}
                          className={`px-3 py-2 rounded-md border text-sm transition-all ${
                            platform === p ? "border-[#C0392B] bg-[#C0392B]/10 text-foreground" : "border-border/30 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="url">URL where the content appears</Label>
                    <Input id="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} className="mt-2" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="font-display text-xl font-semibold mb-4">What do you want to do?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {ACTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAction(opt)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          action === opt ? "border-[#C0392B] bg-[#C0392B]/10" : "border-border/30 hover:border-border"
                        }`}
                      >
                        <div className="font-medium text-foreground">{opt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav */}
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
                  Back
                </Button>
                {step < 3 ? (
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={(step === 1 && !assetType) || (step === 2 && (!platform || !url))}
                    className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={generate}
                    disabled={!action || loading}
                    className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white"
                  >
                    {loading ? "Generating…" : "Generate Documents"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {output && (
            <Card className="glass-card border-border/30 mt-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-display text-lg font-semibold">Generated Documents</h3>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-secondary/30 border border-border/30 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                  {output}
                </pre>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    toast.success("Copied to clipboard");
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" /> Copy Document
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default FaceClaimWizard;
