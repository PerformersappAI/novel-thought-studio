import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Lock, ShieldAlert, FileSearch } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Severity = "red" | "yellow" | "green";
interface Finding {
  severity: Severity;
  category: string;
  excerpt: string;
  explanation: string;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  red: "border-l-4 border-[#C0392B] bg-[#C0392B]/8",
  yellow: "border-l-4 border-[#C9A84C] bg-[#C9A84C]/8",
  green: "border-l-4 border-emerald-500 bg-emerald-500/8",
};
const SEVERITY_LABEL: Record<Severity, string> = {
  red: "Danger",
  yellow: "Review",
  green: "Acceptable",
};
const SEVERITY_DOT: Record<Severity, string> = {
  red: "bg-[#C0392B]",
  yellow: "bg-[#C9A84C]",
  green: "bg-emerald-500",
};

const ContractChecker = () => {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [summary, setSummary] = useState("");

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

  const analyze = async () => {
    if (text.trim().length < 50) {
      toast.error("Paste at least a paragraph of contract text.");
      return;
    }
    setLoading(true);
    setFindings(null);
    try {
      const { data, error } = await supabase.functions.invoke("contract-checker", {
        body: { text },
      });
      if (error) throw error;
      setFindings(data?.findings ?? []);
      setSummary(data?.summary ?? "");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to analyze");
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
              <h1 className="font-display text-2xl font-bold">AI Consent Contract Checker — Pro</h1>
              <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
                Paste any contract or rider — our AI flags overly broad likeness rights, missing compensation, no expiration, AI-training loopholes, and red-flag language in plain English.
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
      <div className="container px-4 pt-24 pb-16 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Tools</Link>
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C0392B]/10 border border-[#C0392B]/30 mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-[#C0392B]" />
              <span className="text-xs text-[#C0392B] font-medium">Pro Tool</span>
            </div>
            <h1 className="font-display text-3xl font-bold">AI Consent Contract Checker</h1>
            <p className="text-muted-foreground mt-2">Spot dangerous likeness clauses before you sign.</p>
          </div>

          <Card className="glass-card border-border/30">
            <CardContent className="p-6">
              <Textarea
                placeholder="Paste your contract, rider, or AI consent clause here…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[240px] font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                <div className="text-xs text-muted-foreground">{text.length} characters</div>
                <Button onClick={analyze} disabled={loading} className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
                  <FileSearch className="w-4 h-4 mr-2" />
                  {loading ? "Analyzing…" : "Analyze Contract"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {findings && (
            <div className="mt-6 space-y-4">
              {summary && (
                <Card className="glass-card border-border/30">
                  <CardContent className="p-5">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Summary</div>
                    <p className="text-sm text-foreground">{summary}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {(["red", "yellow", "green"] as Severity[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${SEVERITY_DOT[s]}`} />
                    <span>{SEVERITY_LABEL[s]}</span>
                  </div>
                ))}
              </div>

              {findings.length === 0 ? (
                <Card className="glass-card border-border/30">
                  <CardContent className="p-6 text-muted-foreground text-center">
                    No findings returned.
                  </CardContent>
                </Card>
              ) : (
                findings.map((f, i) => (
                  <Card key={i} className={`glass-card ${SEVERITY_STYLES[f.severity]}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="font-display font-semibold text-foreground">{f.category}</div>
                        <span className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded ${SEVERITY_DOT[f.severity]} text-white`}>
                          {SEVERITY_LABEL[f.severity]}
                        </span>
                      </div>
                      {f.excerpt && (
                        <blockquote className="text-sm italic text-muted-foreground border-l-2 border-border pl-3 my-2">
                          "{f.excerpt}"
                        </blockquote>
                      )}
                      <p className="text-sm text-foreground/90 mt-2">{f.explanation}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ContractChecker;
