import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ImageIcon } from "lucide-react";

type Result = { verdict: string; fake_confidence_pct?: number; note?: string };

const CheckImageCard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onCheck = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("https://api.claimmyface.com/check-image", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Request failed");
      const data: Result = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't analyze that image. Please try a different file.");
    } finally {
      setLoading(false);
    }
  };

  const isFake = result?.verdict === "likely_fake";
  const isReal = result?.verdict === "likely_real";

  return (
    <Card className="mb-6 border-border/20 bg-card/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          Check an Image for Deepfakes
        </CardTitle>
        <CardDescription>
          Upload a photo to get an AI estimate of whether it may be manipulated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
              setError(null);
            }}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={onCheck} disabled={!file || loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Check Image"
            )}
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && !error && (
          <div className="space-y-2">
            {isFake && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
                ⚠️ Likely Manipulated — {result.fake_confidence_pct}% confidence this image is AI-generated or altered
              </div>
            )}
            {isReal && (
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm font-semibold text-green-600 dark:text-green-400">
                ✓ Likely Authentic — no strong signs of manipulation detected
              </div>
            )}
            {!isFake && !isReal && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                {result.verdict}
              </div>
            )}
            {result.note && (
              <p className="text-xs text-muted-foreground">{result.note}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CheckImageCard;
