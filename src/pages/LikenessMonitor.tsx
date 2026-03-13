import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, ExternalLink, AlertTriangle, Clock, Upload, Image as ImageIcon, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  url: string;
  title: string;
  description: string;
  snippet: string;
  match_type?: string;
  matching_images?: string[];
}

interface Scan {
  id: string;
  query: string;
  scan_type: string;
  status: string;
  result_count: number;
  results: ScanResult[];
  created_at: string;
  completed_at: string | null;
}

const LikenessMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchScans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("likeness_scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setScans((data as unknown as Scan[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchScans();
  }, [user]);

  const runTextScan = async () => {
    if (!query.trim() || !user) return;
    setScanning(true);
    try {
      const { data: scan, error: insertError } = await supabase
        .from("likeness_scans")
        .insert({ user_id: user.id, query: query.trim(), status: "scanning", scan_type: "web_search" })
        .select()
        .single();
      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke("likeness-scan", {
        body: { query: query.trim(), scanId: scan.id },
      });
      if (error) throw error;

      toast({ title: "Scan complete", description: `Found ${data?.data?.length || 0} results.` });
      setQuery("");
      await fetchScans();
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please use an image under 10MB.", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      // Strip the data:image/...;base64, prefix for the API
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const runImageScan = async () => {
    if (!imageBase64 || !user) return;
    setScanning(true);
    try {
      const { data: scan, error: insertError } = await supabase
        .from("likeness_scans")
        .insert({ user_id: user.id, query: "Image scan", status: "scanning", scan_type: "image_search" })
        .select()
        .single();
      if (insertError) throw insertError;

      const { data, error } = await supabase.functions.invoke("likeness-image-scan", {
        body: { imageBase64, scanId: scan.id },
      });
      if (error) throw error;

      toast({ title: "Image scan complete", description: `Found ${data?.data?.length || 0} matches.` });
      setImagePreview(null);
      setImageBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchScans();
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Likeness Monitor</h1>
          <p className="text-muted-foreground mt-1">Search for unauthorized use of your name or face online.</p>
        </div>

        {/* Search tabs */}
        <Tabs defaultValue="image" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="image" className="gap-2"><ImageIcon className="w-4 h-4" /> Image Search</TabsTrigger>
            <TabsTrigger value="text" className="gap-2"><Type className="w-4 h-4" /> Text Search</TabsTrigger>
          </TabsList>

          <TabsContent value="image">
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Upload a photo of your face</p>
                <p className="text-xs text-muted-foreground mb-4">
                  We'll use Google Vision to find where this image (or similar ones) appear online.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Selected"
                      className="w-32 h-32 object-cover rounded-lg border border-border"
                    />
                    <button
                      onClick={() => { setImagePreview(null); setImageBase64(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Choose photo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageSelect}
                />

                <div className="flex-1 flex flex-col justify-end">
                  <Button onClick={runImageScan} disabled={scanning || !imageBase64} className="w-full sm:w-auto">
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    {scanning ? "Scanning…" : "Search for this face"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <Card className="p-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter your name or stage name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runTextScan()}
                  disabled={scanning}
                  className="flex-1"
                />
                <Button onClick={runTextScan} disabled={scanning || !query.trim()}>
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                  {scanning ? "Scanning…" : "Scan"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                We'll search for web pages that reference your name alongside terms like image, photo, video, deepfake, or AI.
              </p>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Scan History */}
        <div className="space-y-4">
          <h2 className="text-lg font-display font-semibold text-foreground">Scan History</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
          ) : scans.length === 0 ? (
            <p className="text-muted-foreground text-sm">No scans yet. Run your first scan above.</p>
          ) : (
            scans.map((scan) => (
              <Card key={scan.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {scan.scan_type === "image_search" ? <><ImageIcon className="w-3 h-3 mr-1" /> Image</> : <><Type className="w-3 h-3 mr-1" /> Text</>}
                    </Badge>
                    <span className="font-medium text-foreground">"{scan.query}"</span>
                    <Badge variant={scan.status === "completed" ? "default" : "secondary"}>
                      {scan.status === "completed" ? `${scan.result_count} results` : scan.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(scan.created_at).toLocaleDateString()}
                  </span>
                </div>

                {scan.results && (scan.results as ScanResult[]).length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/30">
                    {(scan.results as ScanResult[]).map((result, i) => (
                      <a
                        key={i}
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-sm text-foreground truncate">{result.title || result.url}</div>
                              {result.match_type && (
                                <Badge variant="outline" className="text-[10px] shrink-0">
                                  {result.match_type === "visually_similar" ? "Similar" : "Match"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{result.url}</div>
                            {result.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                            )}
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {scan.status === "completed" && scan.result_count === 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-accent" /> No mentions found — that's a good sign!
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LikenessMonitor;
