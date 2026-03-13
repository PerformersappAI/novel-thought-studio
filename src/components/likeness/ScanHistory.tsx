import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, AlertTriangle, Clock, Image as ImageIcon, Type } from "lucide-react";

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

const ScanHistory = ({ scans, loading }: { scans: Scan[]; loading: boolean }) => (
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
                <a key={i} href={result.url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
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
);

export default ScanHistory;
