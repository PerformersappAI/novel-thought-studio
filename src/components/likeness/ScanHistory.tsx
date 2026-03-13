import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ExternalLink, AlertTriangle, Clock, Image as ImageIcon, Type, Trash2, Shield } from "lucide-react";
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
}

const ScanHistory = ({ scans, loading, onUpdate }: { scans: Scan[]; loading: boolean; onUpdate?: () => void }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Record<string, Set<number>>>({});

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
                          {result.match_type && (
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
