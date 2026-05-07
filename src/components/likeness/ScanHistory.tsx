import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  ExternalLink,
  AlertTriangle,
  Clock,
  Image as ImageIcon,
  Type,
  Trash2,
  Shield,
  FileDown,
  Eraser,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { generateLikenessReport } from "@/lib/likenessReport";

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
}

interface ScanHistoryProps {
  scans: Scan[];
  loading: boolean;
  onUpdate?: () => void;
  profile?: { legal_name?: string | null; full_name?: string | null; stage_name?: string | null } | null;
}

const ScanHistory = ({ scans, loading, onUpdate, profile }: ScanHistoryProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Record<string, Set<number>>>({});
  const [clearing, setClearing] = useState(false);
  const [deletingScan, setDeletingScan] = useState<string | null>(null);

  const toggleSelect = (scanId: string, index: number) => {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[scanId] || []);
      if (set.has(index)) set.delete(index);
      else set.add(index);
      next[scanId] = set;
      return next;
    });
  };

  const deleteSelected = async (scan: Scan) => {
    const indices = selected[scan.id];
    if (!indices || indices.size === 0) return;

    const remaining = (scan.results as ScanResult[]).filter((_, i) => !indices.has(i));

    const { error } = await supabase
      .from("likeness_scans")
      .update({ results: remaining as any, result_count: remaining.length })
      .eq("id", scan.id);

    if (error) {
      toast({ title: "Failed to remove results", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Removed ${indices.size} result(s)` });
      setSelected((prev) => ({ ...prev, [scan.id]: new Set() }));
      onUpdate?.();
    }
  };

  const deleteScan = async (scanId: string) => {
    setDeletingScan(scanId);
    const { error } = await supabase.from("likeness_scans").delete().eq("id", scanId);
    setDeletingScan(null);
    if (error) {
      toast({ title: "Couldn't delete scan", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Scan deleted" });
      onUpdate?.();
    }
  };

  const clearAllHistory = async () => {
    if (!user) return;
    setClearing(true);
    const { error } = await supabase.from("likeness_scans").delete().eq("user_id", user.id);
    setClearing(false);
    if (error) {
      toast({ title: "Couldn't clear history", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Scan history cleared", description: "Run a new scan to see fresh results." });
      onUpdate?.();
    }
  };

  const downloadPdf = () => {
    if (scans.length === 0) {
      toast({ title: "Nothing to export", description: "Run a scan first.", variant: "destructive" });
      return;
    }
    try {
      generateLikenessReport(scans as any, {
        legal_name: profile?.legal_name,
        full_name: profile?.full_name,
        stage_name: profile?.stage_name,
        email: user?.email,
      });
      toast({ title: "Report downloaded", description: "Saved to your downloads folder." });
    } catch (e: any) {
      toast({ title: "Couldn't generate PDF", description: e.message, variant: "destructive" });
    }
  };

  const goToDMCA = (result: ScanResult) => {
    navigate("/tools/dmca", {
      state: {
        infringingUrl: result.url,
        originalWorkDescription: `Unauthorized use of my likeness found at: ${result.title || result.url}`,
      },
    });
  };

  const selectedCount = (scanId: string) => selected[scanId]?.size || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-display font-semibold text-foreground">Scan History</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadPdf}
            disabled={loading || scans.length === 0}
          >
            <FileDown className="w-3.5 h-3.5 mr-1.5" />
            Download PDF Report
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || scans.length === 0 || clearing}
                className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                {clearing ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Eraser className="w-3.5 h-3.5 mr-1.5" />
                )}
                Clear All History
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all scan history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {scans.length} scan{scans.length === 1 ? "" : "s"} and
                  their results from your history. You can re-run scans anytime — this just gives you a
                  clean slate to track new findings. Consider downloading a PDF report first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearAllHistory}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, clear everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : scans.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground text-sm">
          History is clear. Run a scan above to see results.
        </Card>
      ) : (
        scans.map((scan) => (
          <Card key={scan.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <Badge variant="outline" className="text-xs shrink-0">
                  {scan.scan_type === "image_search" ? (
                    <><ImageIcon className="w-3 h-3 mr-1" /> Image</>
                  ) : (
                    <><Type className="w-3 h-3 mr-1" /> Text</>
                  )}
                </Badge>
                <span className="font-medium text-foreground truncate">"{scan.query}"</span>
                <Badge variant={scan.status === "completed" ? "default" : "secondary"} className="shrink-0">
                  {scan.status === "completed" ? `${scan.result_count} results` : scan.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(scan.created_at).toLocaleDateString()}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete this scan"
                      disabled={deletingScan === scan.id}
                    >
                      {deletingScan === scan.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Removes the "{scan.query}" scan and its {scan.result_count} result
                        {scan.result_count === 1 ? "" : "s"} from your history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteScan(scan.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete scan
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {scan.results && (scan.results as ScanResult[]).length > 0 && (
              <>
                {selectedCount(scan.id) > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="destructive" size="sm" onClick={() => deleteSelected(scan)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Remove {selectedCount(scan.id)} selected
                    </Button>
                  </div>
                )}
                <div className="space-y-2 pt-2 border-t border-border/30">
                  {(scan.results as ScanResult[]).map((result, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                      <Checkbox
                        checked={selected[scan.id]?.has(i) || false}
                        onCheckedChange={() => toggleSelect(scan.id, i)}
                        className="mt-1 shrink-0"
                      />
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm text-foreground truncate">{result.title || result.url}</div>
                          {result.match_type === "face_match" && (
                            <Badge className="text-[10px] shrink-0 bg-primary text-primary-foreground border-primary glow-red animate-pulse font-bold tracking-wide">
                              🔴 FACE MATCH
                            </Badge>
                          )}
                          {result.match_type && result.match_type !== "face_match" && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {result.match_type === "visually_similar" ? "Similar" : result.match_type === "name_match" ? "Name Match" : "Match"}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{result.url}</div>
                        {result.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>}
                      </a>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="File DMCA Takedown"
                          onClick={(e) => { e.preventDefault(); goToDMCA(result); }}
                        >
                          <Shield className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
  );
};

export default ScanHistory;
