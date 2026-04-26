import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface VerifyData {
  registryId: string;
  registeredAt: string;
  assetsCount: number;
  verified: boolean;
}

const PublicVerify = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VerifyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      // Find first asset matching this registry ID — public, no PII
      const { data: asset } = await supabase
        .from("registry_assets")
        .select("user_id, created_at, registry_id")
        .eq("registry_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!asset) {
        setLoading(false);
        return;
      }

      const [{ count }, { data: ver }] = await Promise.all([
        supabase.from("registry_assets").select("*", { count: "exact", head: true }).eq("user_id", asset.user_id).eq("status", "approved"),
        supabase.from("identity_verifications").select("status").eq("user_id", asset.user_id).maybeSingle(),
      ]);

      setData({
        registryId: asset.registry_id || id,
        registeredAt: asset.created_at,
        assetsCount: count ?? 0,
        verified: ver?.status === "approved",
      });
      setLoading(false);
    };
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="border-b border-border/30 backdrop-blur-sm bg-background/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ClaimMyFace" className="h-7 w-auto" />
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
              Claim My Face <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <p className="text-[#C9A84C] tracking-[0.3em] text-xs mb-2">REGISTRY VERIFICATION</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Public Verification</h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm">{id}</p>
          </div>

          {loading ? (
            <Card className="glass-card border-border/30">
              <CardContent className="py-16 text-center text-muted-foreground">Verifying…</CardContent>
            </Card>
          ) : !data ? (
            <Card className="glass-card border-border/30">
              <CardContent className="py-16 text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-60" />
                <h2 className="font-display text-xl font-semibold text-foreground">Registration Not Found</h2>
                <p className="text-muted-foreground mt-2">No public registration matches this ID.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-[#C0392B] bg-[#0d1117]">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center text-center">
                  {/* Seal */}
                  <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-[#C0392B]" />
                    <div className="absolute inset-2 rounded-full border border-[#C9A84C]/40" />
                    <Shield className="w-12 h-12 text-[#C0392B]" fill="currentColor" />
                  </div>

                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C0392B]/15 border border-[#C0392B]/40 mb-4">
                    <CheckCircle className="w-4 h-4 text-[#C0392B]" />
                    <span className="text-sm font-semibold text-[#C0392B]">Claimed & Protected</span>
                  </div>

                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                    This Face Is Registered
                  </h2>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    The performer behind this Registry ID has established documented face and likeness registration with ClaimMyFace.
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4 w-full mt-10">
                    <div className="p-4 rounded-lg bg-white/[0.03] border border-border/30">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Registered</div>
                      <div className="text-white font-medium mt-1 text-sm">
                        {new Date(data.registeredAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/[0.03] border border-border/30">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Assets Protected</div>
                      <div className="text-white font-medium mt-1 text-sm">{data.assetsCount}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/[0.03] border border-border/30">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Identity</div>
                      <div className={`font-medium mt-1 text-sm ${data.verified ? "text-[#C0392B]" : "text-muted-foreground"}`}>
                        {data.verified ? "Verified ✓" : "Pending"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-8 max-w-md">
                    Personal information is intentionally hidden. Only the performer can disclose their identity.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">Are you a performer? Establish your claim date now.</p>
            <Link to="/signup">
              <Button className="bg-[#C0392B] hover:bg-[#C0392B]/90 text-white">
                Get My Certificate <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PublicVerify;
