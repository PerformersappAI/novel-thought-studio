import { useState } from "react";
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
  MessageCircle, Lock as LockIcon, Info, UserX, ArrowRight,
} from "lucide-react";
import ImpersonatorReportModal from "./ImpersonatorReportModal";
import { useToast } from "@/hooks/use-toast";

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

const SAMPLE_ROWS: Row[] = [
  { id: "1", platform: "Instagram", account: "@willrobert5", followers: "12.4K", finding: "Account using your stage name with slight variation (@willrobert5 vs @willroberts)", date: "2026-04-22", status: "Confirmed Fake" },
  { id: "2", platform: "TikTok", account: "@therealroberts_official", followers: "3.1K", finding: "Fake account using your headshot as profile photo", date: "2026-04-19", status: "Confirmed Fake" },
  { id: "3", platform: "X / Twitter", account: "@willrobertsfan", followers: "842", finding: "Fan account using your likeness without disclosure", date: "2026-04-15", status: "Fan Account" },
  { id: "4", platform: "Facebook", account: "Will Roberts (Actor)", followers: "5.7K", finding: "Account claiming to be you with your bio copied", date: "2026-04-10", status: "Suspected Fake" },
  { id: "5", platform: "Instagram", account: "@willroberts.dm", followers: "1.2K", finding: "Account soliciting money using your photos", date: "2026-04-08", status: "Confirmed Fake" },
  { id: "6", platform: "Threads", account: "@w_roberts_actor", followers: "440", finding: "Account claiming to be you with your bio copied", date: "2026-03-29", status: "Resolved" },
];

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
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>(SAMPLE_ROWS);
  const [modalRow, setModalRow] = useState<Row | null>(null);

  const dismiss = (id: string) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status: "Resolved" } : x)));
    toast({ title: "Marked as resolved" });
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
                      This is different from deepfakes. Impersonators create real accounts pretending
                      to be you — using your photos to scam fans, solicit money, or damage your reputation.
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Followers</TableHead>
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
                    <TableCell className="text-foreground whitespace-nowrap">{r.account}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{r.followers}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md">
                      <div className="truncate">{r.finding}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(r.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-md border whitespace-nowrap ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap gap-2 justify-end">
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
                        <Button asChild size="sm" variant="outline">
                          <Link to="/tools/contracts">Cease & Desist</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ImpersonatorReportModal
        open={!!modalRow}
        onClose={() => setModalRow(null)}
        performerName={performerName}
        registryId={registryId}
        defaultPlatform={modalRow?.platform || ""}
        defaultUrl={modalRow ? `https://${modalRow.platform.toLowerCase().replace(/[^a-z]/g, "")}.com/${modalRow.account.replace("@", "")}` : ""}
      />
    </>
  );
};

export default ImpersonatorDetection;
