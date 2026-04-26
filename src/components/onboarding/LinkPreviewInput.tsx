import { useState } from "react";
import { Link2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type LinkType = "imdb" | "instagram" | "tiktok" | "youtube" | "url";

interface Props {
  value: string;
  onChange: (v: string) => void;
  type: LinkType;
  placeholder?: string;
}

const buildUrl = (raw: string, type: LinkType): string => {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  switch (type) {
    case "imdb":
      return v.toLowerCase().includes("imdb.com")
        ? `https://${v.replace(/^\/+/, "")}`
        : `https://www.imdb.com/find?q=${encodeURIComponent(v)}`;
    case "instagram":
      return `https://www.instagram.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "youtube":
      return `https://www.youtube.com/@${handle}`;
    case "url":
    default:
      return `https://${v}`;
  }
};

const LinkPreviewInput = ({ value, onChange, type, placeholder }: Props) => {
  const [open, setOpen] = useState(false);
  const hasValue = !!value.trim();
  const previewUrl = buildUrl(value, type);

  return (
    <>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => hasValue && setOpen(true)}
                disabled={!hasValue}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors",
                  hasValue
                    ? "text-primary hover:bg-primary/10 cursor-pointer"
                    : "text-muted-foreground/50 cursor-not-allowed",
                )}
                aria-label="Preview link"
              >
                <Link2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">Click to preview your link</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 gap-0 flex flex-col">
          <div className="flex items-center gap-3 p-3 border-b border-border bg-card">
            <Link2 className="w-4 h-4 text-primary shrink-0" />
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-muted-foreground hover:text-primary truncate flex-1 font-mono"
            >
              {previewUrl}
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <iframe
            src={previewUrl}
            className="flex-1 w-full bg-background"
            title="Link preview"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LinkPreviewInput;
