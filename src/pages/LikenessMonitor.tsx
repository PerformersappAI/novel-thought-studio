import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ExternalLink, AlertTriangle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  url: string;
  title: string;
  description: string;
  snippet: string;
}

interface Scan {
  id: string;
  query: string;
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

  const runScan = async () => {
    if (!query.trim() || !user) return;
    setScanning(true);

    try {
      // Create scan record
      const { data: scan, error: insertError } = await supabase
        .from("likeness_scans")
        .insert({ user_id: user.id, query: query.trim(), status: "scanning" })
        .select()
        .single();

      if (insertError) throw insertError;

      // Run the scan via edge function
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Likeness Monitor</h1>
          <p className="text-muted-foreground mt-1">Search the web for mentions of your name or likeness.</p>
        </div>

        {/* Search form */}
        <Card className="p-6">
          <div className="flex gap-3">
            <Input
              placeholder="Enter your name or stage name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runScan()}
              disabled={scanning}
              className="flex-1"
            />
            <Button onClick={runScan} disabled={scanning || !query.trim()}>
              {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              {scanning ? "Scanning…" : "Scan"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            We'll search for web pages that reference your name alongside terms like image, photo, video, deepfake, or AI.
          </p>
        </Card>

        {/* Past scans */}
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
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{result.title || result.url}</div>
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
