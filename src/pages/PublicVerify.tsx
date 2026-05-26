import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, CheckCircle, ArrowRight, AlertCircle, Fingerprint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/cmf-shield-logo.png";

interface CredentialData {
  kind: "credential";
  certificateId: string;
  issuedAt: string;
  stageName: string | null;
  legalName: string | null;
  faceHash: string | null;
  voiceHash: string | null;
  isValid: boolean;
}

interface RegistryData {
  kind: "registry";
  registryId: string;
  registeredAt: string;
  assetsCount: number;
  verified: boolean;
}

type Data = CredentialData | RegistryData;

const PublicVerify = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      // 1. Try the new credentials table first
      const { data: cred } = await supabase
        .from("credentials")
        .select("certificate_id, issued_at, stage_name, legal_name, face_hash, voice_hash, is_valid")
        .eq("certificate_id", id)
        .maybeSingle();

      if (cred) {
        setData({
          kind: "credential",
          certificateId: cred.certificate_id,
          issuedAt: cred.issued_at,
          stageName: cred.stage_name,
          legalName: cred.legal_name,
          faceHash: cred.face_hash,
          voiceHash: cred.voice_hash,
          isValid: cred.is_valid,
        });
        setLoading(false);
        return;
      }

      // 2. Fall back to legacy registry_assets lookup
      const { data: asset } = await supabase
        .from("registry_assets")
        .select("user_id, created_at, registry_id")
        .eq("registry_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!asset) { setLoading(false); return; }

      const [{ count }, { data: ver }] = await Promise.all([
        supabase.from("registry_assets").select("*", { count: "exact", head: true }).eq("user_id", asset.user_id).eq("status", "approved"),
        supabase.from("identity_verifications").select("status").eq("user_id", asset.user_id).maybeSingle(),
      ]);

      setData({
        kind: "registry",
        registryId: asset.registry_id || id,
        registeredAt: asset.created_at,
        assetsCount: count ?? 0,
        verified: ver?.status === "approved",
      });
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 backdrop-blur-sm bg-background/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ClaimMyFace" className="h-7 w-auto" />
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-[#C41230] hover:bg-[#C41230]/90 text-white">
              Claim My Face <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <p className="text-[#D4A843] tracking-[0.3em] text-xs mb-2">CERTIFICATE VERIFICATION</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Verify This Certificate</h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm">{id}</p>
          </div>

          {loading ? (
            <Card className="glass-card border-border/30"><CardContent className="py-16 text-center text-muted-foreground">Verifying…</CardContent></Card>
          ) : !data ? (
            <Card className="glass-card border-border/30">
              <CardContent className="py-16 text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-60" />
                <h2 className="font-display text-xl font-semibold text-foreground">Certificate Not Found</h2>
                <p className="text-muted-foreground mt-2">No public record matches this ID.</p>
              </CardContent>
            </Card>
          ) : data.kind === "credential" ? (
            <Card className="border-2 border-[#D4A843] bg-gradient-to-br from-[#0B1526] to-[#142340]">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center text-center">
                  <div className="relative w-28 h-28 flex items-center justify-center mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-[#D4A843]" />
                    <div className="absolute inset-2 rounded-full border border-[#C41230]/60" />
                    <Shield className="w-12 h-12 text-[#D4A843]" fill="currentColor" />
                  </div>

                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 ${data.isValid ? "bg-emerald-500/15 border border-emerald-500/40" : "bg-destructive/15 border border-destructive/40"}`}>
                    {data.isValid ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-destructive" />}
                    <span className={`text-sm font-semibold ${data.isValid ? "text-emerald-400" : "text-destructive"}`}>
                      {data.isValid ? "Authentic — Issued by ClaimMyFace" : "Revoked"}
                    </span>
                  </div>

                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
                    {data.stageName || data.legalName || "Verified Performer"}
                  </h2>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    This Identity Credential Certificate was cryptographically issued by ClaimMyFace on{" "}
                    {new Date(data.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 w-full mt-8">
                    <div className="p-4 rounded-lg bg-white/[0.04] border border-[#D4A843]/30 text-left">
                      <div className="text-[10px] text-[#D4A843] uppercase tracking-wider mb-1">Certificate ID</div>
                      <div className="text-white font-mono text-sm break-all">{data.certificateId}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/[0.04] border border-border/30 text-left">
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Issued (UTC)</div>
                      <div className="text-white font-mono text-sm">{new Date(data.issuedAt).toISOString()}</div>
                    </div>
                    {data.faceHash && (
                      <div className="p-4 rounded-lg bg-white/[0.04] border border-border/30 text-left sm:col-span-2">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Face SHA-256</div>
                        <div className="text-white/90 font-mono text-[11px] break-all">{data.faceHash}</div>
                      </div>
                    )}
                    {data.voiceHash && (
                      <div className="p-4 rounded-lg bg-white/[0.04] border border-border/30 text-left sm:col-span-2">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><Fingerprint className="w-3 h-3" /> Voice SHA-256</div>
                        <div className="text-white/90 font-mono text-[11px] break-all">{data.voiceHash}</div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-8 max-w-md">
                    Personal contact details are intentionally hidden. Only the performer can disclose further identity information.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-[#C41230] bg-[#0B1526]">
              <CardContent className="p-8 md:p-12">
                <div className="flex flex-col items-center text-center">
                  <Shield className="w-12 h-12 text-[#C41230]" fill="currentColor" />
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C41230]/15 border border-[#C41230]/40 mt-4 mb-4">
                    <CheckCircle className="w-4 h-4 text-[#C41230]" />
                    <span className="text-sm font-semibold text-[#C41230]">Claimed & Protected</span>
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-white">This Face Is Registered</h2>
                  <div className="grid sm:grid-cols-3 gap-4 w-full mt-8">
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
                      <div className={`font-medium mt-1 text-sm ${data.verified ? "text-[#C41230]" : "text-muted-foreground"}`}>
                        {data.verified ? "Verified ✓" : "Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-4">Are you a performer? Establish your claim date now.</p>
            <Link to="/signup">
              <Button className="bg-[#C41230] hover:bg-[#C41230]/90 text-white">
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
