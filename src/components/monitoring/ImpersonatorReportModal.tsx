import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  performerName?: string;
  registryId?: string | null;
  defaultPlatform?: string;
  defaultUrl?: string;
}

const TYPES = [
  "Using my photos",
  "Using my name",
  "Claiming to be me",
  "Soliciting money as me",
  "Other",
];

const ImpersonatorReportModal = ({
  open, onClose, performerName = "", registryId, defaultPlatform = "", defaultUrl = "",
}: Props) => {
  const { toast } = useToast();
  const [name, setName] = useState(performerName);
  const [registry, setRegistry] = useState(registryId || "");
  const [platform, setPlatform] = useState(defaultPlatform);
  const [url, setUrl] = useState(defaultUrl);
  const [type, setType] = useState(TYPES[0]);
  const [evidence, setEvidence] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);

  const handleGenerate = () => {
    const report = `IMPERSONATION REPORT
====================

Reporter: ${name}
ClaimMyFace Registry ID: ${registry || "N/A"}
Date: ${new Date().toLocaleDateString()}

Platform: ${platform}
Reported Account URL: ${url}
Type of Impersonation: ${type}

Statement:
I am the verified rights holder of the likeness used by the above account.
My identity is registered and timestamped via ClaimMyFace
(Registry ID: ${registry || "N/A"}).

Evidence & Description:
${evidence || "(No additional evidence provided.)"}

I request that this account be reviewed and removed for violating the
platform's impersonation policy. I am willing to provide further verification.

Signed,
${name}
`;
    setGenerated(report);
    // Decrement takedown credit
    window.dispatchEvent(new CustomEvent("cmf:takedown-used"));
    toast({ title: "Report generated", description: "Copy the text or download the PDF below." });
  };

  const downloadPdf = () => {
    if (!generated) return;
    // Simple text-as-pdf via Blob (browser will open it; users can print to PDF).
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `impersonation-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyText = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    toast({ title: "Copied to clipboard" });
  };

  const handleClose = () => {
    setGenerated(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Report Impersonator Account</DialogTitle>
          <DialogDescription>
            Generate a platform-ready impersonation report linked to your verified registry record.
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="registry">Your registry ID</Label>
              <Input id="registry" value={registry} onChange={(e) => setRegistry(e.target.value)} placeholder="CMF-2026-XXXXX" />
            </div>
            <div>
              <Label htmlFor="platform">Platform</Label>
              <Input id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Instagram" />
            </div>
            <div>
              <Label htmlFor="url">Fake account URL</Label>
              <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label>Type of impersonation</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="evidence">Evidence description</Label>
              <Textarea
                id="evidence"
                rows={4}
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Describe what you've observed: copied bio, identical photos, DMs to fans, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button onClick={handleGenerate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Generate Report <FileText className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <pre className="whitespace-pre-wrap text-xs bg-secondary/40 border border-border/40 rounded-lg p-4 max-h-72 overflow-y-auto font-mono text-foreground">
{generated}
            </pre>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copyText} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Copy Text
              </Button>
              <Button onClick={downloadPdf} variant="outline">
                Download <Download className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImpersonatorReportModal;
