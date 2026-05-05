import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Instagram, Music2, Facebook, Twitter, Youtube, Linkedin,
  MessageCircle, Lock as LockIcon, Info, UserX, ArrowRight, Trash2,
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
  { name: "YouTube", Icon: Youtube },
  { name: "LinkedIn", Icon: Linkedin },
  { name: "Threads", Icon: MessageCircle },
  { name: "Content Platforms", Icon: LockIcon },
];

type Status = "Confirmed Fake" | "Suspected Fake" | "Fan Account" | "Resolved";

interface Row {
  id: string;
  platform: string;
  account: string;
  followers: string;
  finding: string;
  date: string;
  status: Status;
}

const STATUS_STYLES: Record<Status, string> = {
  "Confirmed Fake": "bg-[hsl(var(--crimson))]/15 text-[hsl(var(--crimson-bright))] border-[hsl(var(--crimson))]/40",
  "Suspected Fake": "bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/40",
  "Fan Account": "bg-blue-500/15 text-blue-300 border-blue-500/40",
  "Resolved": "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
};

interface Props {
  performerName?: string;
  registryId?: string | null;
}

const ImpersonatorDetection = ({ performerName, registryId }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [modalRow, setModalRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("mentions")
        .select("id, mention_type, title, url, found_at, status")
        .eq("user_id", user.id)
        .in("status", ["New Alert", "Under Review"])
        .order("found_at", { ascending: false });
      
      const mapped: Row[] = (data ?? []).map((m: any) => ({
        id: m.id,
        platform: m.mention_type || "Web",
        account: m.url ? new URL(m.url).pathname.split("/").pop() || "" : "",
        followers: "",
        finding: m.title,
        date: m.found_at,
        status: "Suspected Fake" as Status,
      }));
      setRows(mapped);
      setLoading(false);
    })();
  }, [user]);

  const deleteRow = async (id: string) => {
    const { error } = await supabase.from("mentions").delete().eq("id", id);
    if (error) { toast({ title: "Failed to delete", variant: "destructive" }); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: "Deleted" });
  };

  const dismiss = async (id: string) => {
    await supabase.from("mentions").update({ status: "Dismissed" } as any).eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
    toast({ title: "Dismissed" });
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
                      Impersonators create real accounts pretending to be you — using your photos to scam fans, solicit money, or damage your reputation.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Fake profiles using your photos, name, or likeness across social platforms.
              </p>
            </div>
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
              <p className="text-sm text-muted-foreground">
                {loading ? "Loading…" : "No impersonator accounts detected. We're watching 24/7."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>What Was Found</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground whitespace-nowrap">{r.platform}</TableCell>
                      <TableCell className="text-muted-foreground max-w-md">
                        <div className="truncate">{r.finding}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-md border whitespace-nowrap ${STATUS_STYLES[r.status] || ""}`}>
                          {r.status}
                        </span>
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
                            Report as Fake <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => dismiss(r.id)}>
                            This is Fine
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
        defaultUrl={""}
      />
    </>
  );
};

export default ImpersonatorDetection;
