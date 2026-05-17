import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Mic, PenLine, AlertTriangle } from "lucide-react";

interface Props {
  mentions: { mention_type?: string | null; status?: string | null }[];
}

function matches(types: string[], type: string | null | undefined) {
  if (!type) return false;
  const t = type.toLowerCase();
  return types.some((x) => t.includes(x));
}

const DetectionPanels = ({ mentions }: Props) => {
  const photo = mentions.filter((m) => matches(["image", "photo", "face"], m.mention_type)).length;
  const voice = mentions.filter((m) => matches(["voice", "audio"], m.mention_type)).length;
  const writing = mentions.filter((m) =>
    matches(["writing", "article", "web", "text"], m.mention_type)
  ).length;
  const threats = mentions.filter((m) => {
    const s = (m.status || "").toLowerCase();
    const t = (m.mention_type || "").toLowerCase();
    return s.includes("threat") || s.includes("alert") || t.includes("deepfake");
  }).length;

  const items = [
    { icon: Camera, label: "Photo Matches", count: photo, tab: "image" },
    { icon: Mic, label: "Voice Matches", count: voice, tab: "voice" },
    { icon: PenLine, label: "Writing Matches", count: writing, tab: "web" },
    { icon: AlertTriangle, label: "Overall Threats", count: threats, tab: "threats" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {items.map(({ icon: Icon, label, count, tab }) => (
        <Link
          key={label}
          to={`/dashboard/monitoring?tab=${tab}`}
          className="glass-card rounded-2xl border border-border/30 p-4 hover:border-primary/40 transition-colors flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <Icon className="w-5 h-5 text-primary" />
            <span
              className={`text-2xl font-display font-bold ${
                label === "Overall Threats" && count > 0 ? "text-destructive" : "text-foreground"
              }`}
            >
              {count}
            </span>
          </div>
          <div className="text-xs font-body text-muted-foreground uppercase tracking-wider">
            {label}
          </div>
        </Link>
      ))}
    </motion.div>
  );
};

export default DetectionPanels;
