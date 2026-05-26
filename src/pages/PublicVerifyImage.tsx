import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { extractWatermark, WatermarkPayload } from "@/lib/stegoWatermark";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, ShieldCheck, ShieldAlert, Loader2, ArrowLeft } from "lucide-react";

const PublicVerifyImage = () => {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [payload, setPayload] = useState<WatermarkPayload | null | "none">(null);
  const [owner, setOwner] = useState<any | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setBusy(true);
    setPayload(null);
    setOwner(null);
    setPreview(URL.createObjectURL(file));
    try {
      const p = await extractWatermark(file);
      if (!p) { setPayload("none"); return; }
      setPayload(p);
      const { data } = await supabase
        .from("credentials")
        .select("certificate_id, legal_name, stage_name, issued_at, is_valid, headshot_url")
        .eq("certificate_id", p.certificateId)
        .maybeSingle();
      setOwner(data || null);
    } catch {
      setPayload("none");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> ClaimMyFace
          </Link>
          <span className="text-xs uppercase tracking-[0.3em] text-accent">Verify Image</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl sm:text-4xl">Verify a Protected Image</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload any image to check whether it contains an invisible ClaimMyFace watermark
            and see whose registered identity it belongs to.
          </p>
        </div>

        <Card className="p-8">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex flex-col items-center gap-4">
            {preview ? (
              <img src={preview} alt="Uploaded" className="max-h-64 rounded-lg border border-border" />
            ) : (
              <div className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">PNG, JPG, or WEBP</span>
              </div>
            )}
            <Button onClick={() => inputRef.current?.click()} disabled={busy}>
              {busy ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Checking…</> : "Choose image"}
            </Button>
          </div>
        </Card>

        {payload === "none" && (
          <Card className="p-6 border-destructive/40 bg-destructive/5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">No ClaimMyFace watermark detected</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This image does not contain a ClaimMyFace identity watermark, or the watermark was
                  destroyed by re-encoding (e.g. heavy JPEG compression).
                </p>
              </div>
            </div>
          </Card>
        )}

        {payload && payload !== "none" && (
          <Card className="p-6 border-emerald-500/40 bg-emerald-500/5 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-300">Authentic ClaimMyFace Watermark</p>
                <p className="text-sm text-muted-foreground">Issued by {payload.issuer}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Field label="Stage Name" value={payload.stageName} />
              <Field label="Certificate ID" value={payload.certificateId} mono />
              <Field label="Registered" value={new Date(payload.registrationDate).toLocaleString()} />
              {owner && (
                <Field label="Registry Status" value={owner.is_valid ? "Valid" : "Revoked"} />
              )}
            </div>
            {owner && (
              <Link to={`/verify/${owner.certificate_id}`} className="inline-flex text-sm text-primary hover:underline">
                View full credential →
              </Link>
            )}
          </Card>
        )}
      </main>
    </div>
  );
};

const Field = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="rounded-md border border-border/60 bg-background/40 p-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className={mono ? "font-mono text-xs break-all" : "text-sm"}>{value}</p>
  </div>
);

export default PublicVerifyImage;
