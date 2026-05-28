import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Loader2, Image as ImageIcon, Check, ArrowRight } from "lucide-react";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import { resolveHeadshotUrl } from "@/lib/headshotUrl";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png"];

const OnboardingHeadshot = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("headshot_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.headshot_url) {
        const resolved = await resolveHeadshotUrl(data.headshot_url);
        if (resolved) setPreview(resolved);
        setExisting(true);
      }
    })();
  }, [user]);

  const handleFile = (f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      toast({ title: "Unsupported format", description: "Please upload a JPG or PNG.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_BYTES) {
      toast({ title: "File too large", description: "Maximum file size is 10MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!user || !file) {
      if (existing && preview) { navigate("/onboarding/voice"); return; }
      return;
    }
    setUploading(true);
    try {
      const ext = file.type === "image/png" ? "png" : "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("headshots").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      // Store the storage path (bucket is private; rendered via signed URL).
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ headshot_url: path, face_registered_at: new Date().toISOString() } as any)
        .eq("user_id", user.id);
      if (dbErr) throw dbErr;
      toast({ title: "Headshot uploaded", description: "Your reference photo is saved." });
      navigate("/onboarding/voice");
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <OnboardingProgress step={2} />

        <div className="text-center space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Step 2 of 5</p>
          <h1 className="font-display text-3xl sm:text-4xl">Headshot Registration</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Upload your professional headshot — a clear, well-lit photo of your face. This is used to
            search for unauthorized use of your image across the web.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {preview ? (
            <div className="flex flex-col items-center gap-4">
              <img
                src={preview}
                alt="Headshot preview"
                className="w-56 h-56 object-cover rounded-2xl border-2 border-accent/40 shadow-lg"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4 mr-2" /> Replace photo
                </Button>
                {existing && !file && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <Check className="w-3.5 h-3.5" /> Current headshot on file
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <ImageIcon className="w-12 h-12" />
              <div className="text-center">
                <p className="font-medium">Click to upload your headshot</p>
                <p className="text-xs mt-1">JPG or PNG · Max 10MB</p>
              </div>
            </button>
          )}

          <ul className="text-xs text-muted-foreground space-y-1 mt-6 max-w-md mx-auto">
            <li>• Single photo, clear face, well-lit</li>
            <li>• JPG or PNG, up to 10MB</li>
            <li>• Saved securely to your registry profile</li>
          </ul>
        </Card>

        <div className="flex justify-between items-center">
          <Link to="/onboarding/profile" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
          <Button onClick={submit} disabled={uploading || (!file && !existing)} size="lg">
            {uploading ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…</>) :
              (<>Continue <ArrowRight className="w-4 h-4 ml-1" /></>)}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingHeadshot;
