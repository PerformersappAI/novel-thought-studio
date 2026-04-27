import { Finding } from "./findings";
import { FileText, Play, Mic } from "lucide-react";

interface Props {
  finding: Finding;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-full aspect-video",
};

const FindingThumbnail = ({ finding, size = "sm" }: Props) => {
  const cls = `${sizeMap[size]} rounded object-cover border border-border/40 bg-secondary/40 shrink-0 relative overflow-hidden`;

  if (finding.thumbnailUrl) {
    return (
      <div className={cls}>
        <img
          src={finding.thumbnailUrl}
          alt={finding.matchLabel || finding.platform}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {finding.mediaType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        )}
        {finding.mediaType === "audio" && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/40">
            <Mic className="w-4 h-4 text-white" />
          </div>
        )}
        {finding.matchLabel && size !== "sm" && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate">
            {finding.matchLabel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${cls} flex items-center justify-center`}>
      <FileText className="w-4 h-4 text-muted-foreground/60" />
    </div>
  );
};

export default FindingThumbnail;
