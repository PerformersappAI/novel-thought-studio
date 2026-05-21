import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Instagram, Music2, Facebook, Twitter, Linkedin,
  Info, UserX, ArrowRight, Trash2,
  ExternalLink, Search, CheckCircle2,
} from "lucide-react";
import ImpersonatorReportModal from "./ImpersonatorReportModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = [
  { name: "Instagram", Icon: Instagram },
  { name: "TikTok", Icon: Music2 },
  { name: "Facebook", Icon: Facebook },
  { name: "X / Twitter", Icon: Twitter },
  { name: "LinkedIn", Icon: Linkedin },
];

const STATUS_LABELS: Record<string, string> = {
  needs_review: "Needs Review",
  possible_impersonation: "Possible Impersonation",
  public_profile_found: "Public Profile Found",
  possible_unauthorized_use: "Possible Unauthorized Use",
  dismissed: "Dismissed",
  confirmed: "Confirmed Impersonation",
};

const STATUS_STYLES: Record<string, string> = {
  needs_review: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/40",
  possible_impersonation: "bg-[hsl(var(--crimson))]/15 text-[hsl(var(--crimson-bright))] border-[hsl(var(--crimson))]/40",
  public_profile_found: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  possible_unauthorized_use: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  dismissed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  confirmed: "bg-[hsl(var(--crimson))]/25 text-[hsl(var(--crimson-bright))] border-[hsl(var(--crimson))]/60",
};

const RISK_STYLES: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  medium: "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/40",
  high: "bg-[hsl(var(--crimson))]/15 text-[hsl(var(--crimson-bright))] border-[hsl(var(--crimson))]/40",
  critical: "bg-[hsl(var(--crimson))]/25 text-[hsl(var(--crimson-bright))] border-[hsl(var(--crimson))]/60",
};

const PLATFORM_ICONS: Record<string, any> = {
  Instagram, TikTok: Music2, LinkedIn: Linkedin, Facebook, Twitter,
};

interface FakeProfile {
  id: string;
  platform: string;
  url: string;
  username: string | null;
  display_name: string | null;
  bio_snippet: string | null;
  profile_pic_url: string | null;
  follower_count: number | null;
  match_reason: string | null;
  confidence_score: number;
  risk_level: string;
  status: string;
  search_query: string | null;
  found_at: string;
}

interface Props {
  performerName?: string;
  registryId?: string | null;
}

function formatFollowers(n?: number | null): string {
  if (n == null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

const ImpersonatorDetection = ({ performerName, registryId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<FakeProfile[]>([]);
  const [modalRow, setModalRow] = useState<FakeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("possible_fake_profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .neq("status", "dismissed")
      .order("found_at", { ascending: false });

    if (!error && data) {
      setRows(data as unknown as FakeProfile[]);
    }

    const { data: latest } = await supabase
      .from("mentions")
      .select("found_at")
      .eq("user_id", user.id)
      .order("found_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setLastChecked((latest as any)?.found_at ?? null);

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);


  const dismissRow = async (id: string) => {
    await supabase.from("possible_fake_profiles" as any).update({ status: "dismissed" } as any).eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: "Dismissed" });
  };

  const deleteRow = async (id: string) => {
    const { error } = await supabase.from("possible_fake_profiles" as any).delete().eq("id", id);
    if (error) { toast({ title: "Failed to delete", variant: "destructive" }); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: "Deleted" });
  };

  const PlatformIcon = ({ platform }: { platform: string }) => {
    const Icon = PLATFORM_ICONS[platform] || Search;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <>
      <Card className="glass-card border-border/30 mb-6">
        <CardHeader>
          <div className="flex items-start gap-2">
            <UserX className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <CardTitle className="font-display text-lg flex items-center gap-2">
                Impersonator Account Detection
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button aria-label="More info"><Info className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" /></button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Scans public social media profiles on Instagram, TikTok, and LinkedIn for possible impersonation using your name and stage name.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Possible fake or impersonation profiles found using your photos, name, or likeness across social platforms.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0"
              onClick={runScan}
            >
              <RefreshCw className="w-4 h-4" />
              Run Social Scan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Platform grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className="p-3 rounded-lg bg-secondary/30 border border-border/30 flex flex-col items-center text-center gap-2"
              >
                <p.Icon className="w-5 h-5 text-foreground" />
                <div className="text-xs font-medium text-foreground leading-tight">{p.name}</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/60" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</span>
                </div>
              </div>
            ))}
          </div>

          {/* Results table */}
          {rows.length === 0 ? (
            <div className="py-10 text-center">
              <UserX className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Loading…"
                  : "No possible social impersonation profiles found yet."}
              </p>
              {!loading && (
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Click "Run Social Scan" to search Instagram, TikTok, and LinkedIn.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Found</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <PlatformIcon platform={r.platform} />
                          {r.platform}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="flex items-start gap-3">
                          {r.profile_pic_url ? (
                            <img
                              src={r.profile_pic_url}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-border/30 shrink-0"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-secondary/40 border border-border/30 flex items-center justify-center shrink-0">
                              <PlatformIcon platform={r.platform} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-foreground font-medium truncate">
                              {r.display_name || r.username || "Unknown"}
                            </div>
                            {r.username && (
                              <div className="text-xs text-muted-foreground">@{r.username}</div>
                            )}
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {r.follower_count != null && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatFollowers(r.follower_count)} followers
                                </span>
                              )}
                              {r.match_reason && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-primary/30 text-primary/80 bg-primary/5">
                                  {r.match_reason}
                                </span>
                              )}
                            </div>
                            {r.bio_snippet && (
                              <div className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{r.bio_snippet}</div>
                            )}
                            {r.url && (
                              <a
                                href={r.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary/70 hover:text-primary inline-flex items-center gap-0.5 mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Profile <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-md border whitespace-nowrap ${RISK_STYLES[r.risk_level] || ""}`}>
                          {r.risk_level.charAt(0).toUpperCase() + r.risk_level.slice(1)} ({r.confidence_score}%)
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-md border whitespace-nowrap ${STATUS_STYLES[r.status] || STATUS_STYLES.needs_review}`}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(r.found_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() => deleteRow(r.id)}
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => setModalRow(r)}
                          >
                            Report <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => dismissRow(r.id)}>
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ImpersonatorReportModal
        open={!!modalRow}
        onClose={() => setModalRow(null)}
        performerName={performerName}
        registryId={registryId}
        defaultPlatform={modalRow?.platform || ""}
        defaultUrl={modalRow?.url || ""}
      />
    </>
  );
};

export default ImpersonatorDetection;
