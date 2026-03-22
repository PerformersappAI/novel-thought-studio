import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, FileImage, FileAudio, FileVideo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const assetTypeIcons: Record<string, any> = {
  image: FileImage, audio: FileAudio, video: FileVideo,
};

const PerformerProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [assetTypes, setAssetTypes] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (data) {
        setProfile(data);
        const { data: assets } = await supabase
          .from("registry_assets")
          .select("asset_type")
          .eq("user_id", data.user_id)
          .eq("status", "approved");
        setAssetTypes([...new Set((assets ?? []).map((a: any) => a.asset_type))]);

        const { data: ver } = await supabase
          .from("identity_verifications")
          .select("status")
          .eq("user_id", data.user_id)
          .eq("status", "approved")
          .maybeSingle();
        setVerified(!!ver);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Performer not found.</p>
          <Link to="/" className="text-primary hover:underline">Go home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card border-border/30 glow-blue">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="font-display text-xl font-bold text-primary">
                    {profile.display_name?.[0] || profile.full_name?.[0] || "?"}
                  </span>
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
                    {profile.display_name || profile.full_name}
                    {verified && <ShieldCheck className="w-5 h-5 text-primary" />}
                  </h1>
                  {profile.stage_name && (
                    <p className="text-muted-foreground text-sm">aka {profile.stage_name}</p>
                  )}
                </div>
              </div>

              {profile.bio && <p className="text-muted-foreground text-sm mb-6">{profile.bio}</p>}

              <div className="flex flex-wrap gap-2 mb-6">
                {verified && <Badge className="bg-primary/10 text-primary border-primary/30">Verified</Badge>}
                <Badge variant="secondary" className="uppercase">
                  {profile.union_affiliation === "non-union" ? "Non-Union" : profile.union_affiliation}
                </Badge>
              </div>

              {assetTypes.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground mb-3">Registered Asset Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {assetTypes.map((type) => {
                      const Icon = assetTypeIcons[type] || FileImage;
                      return (
                        <Badge key={type} variant="outline" className="capitalize gap-1">
                          <Icon className="w-3 h-3" /> {type}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PerformerProfile;
