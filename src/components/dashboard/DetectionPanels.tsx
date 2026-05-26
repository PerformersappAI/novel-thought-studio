import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Mic, PenLine, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  mentions?: { mention_type?: string | null; status?: string | null }[];
}

function matches(types: string[], type: string | null | undefined) {
  if (!type) return false;
  const t = type.toLowerCase();
  return types.some((x) => t.includes(x));
}

// Map scanner_name (normalized) -> which card it belongs to
const SCANNER_TO_CARD: Record<string, "photo" | "voice" | "writing"> = {
  face_match: "photo",
  photo: "photo",
  image: "photo",
  images: "photo",
  elevenlabs_voice: "voice",
  voice: "voice",
  voice_clone: "voice",
  writing: "writing",
  plagiarism: "writing",
  web: "writing",
};

const DetectionPanels = ({ mentions = [] }: Props) => {
  const { user, session } = useAuth();
  const [scanned, setScanned] = useState<{ photo: number; voice: number; writing: number; threats: number }>({
    photo: 0, voice: 0, writing: 0, threats: 0,
  });

  const photo = mentions.filter((m) => matches(["image", "photo", "face", "photo match"], m.mention_type)).length;
  const voice = mentions.filter((m) => matches(["voice", "audio", "voice clone"], m.mention_type)).length;
  const writing = mentions.filter((m) =>
    matches(["writing", "article", "web", "text", "web mention"], m.mention_type),
  ).length;
  const threats = mentions.filter((m) => {
    const s = (m.status || "").toLowerCase();
    const t = (m.mention_type || "").toLowerCase();
    return (
      s.includes("threat") || s.includes("alert") ||
      t.includes("deepfake") || t.includes("fake profile") || t.includes("voice clone")
    );
  }).length;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !session) return;
      const { data } = await supabase
        .from("scan_runs")
        .select("scanner_name,items_scanned")
        .order("started_at", { ascending: false })
        .limit(100);
      if (cancelled || !data) return;
      const totals = { photo: 0, voice: 0, writing: 0, threats: 0 };
      for (const row of data as any[]) {
        const key = (row.scanner_name || "").toString().toLowerCase().replace(/[\s-]+/g, "_");
        const card = SCANNER_TO_CARD[key];
        const n = Number(row.items_scanned || 0);
        if (card) totals[card] += n;
        totals.threats += n;
      }
      setScanned(totals);
    })();
    return () => { cancelled = true; };
  }, [user, session]);

  const items = [
    { icon: Camera, label: "Photo Matches", count: photo, scanned: scanned.photo, tab: "image" },
    { icon: Mic, label: "Voice Matches", count: voice, scanned: scanned.voice, tab: "voice" },
    { icon: PenLine, label: "Writing Matches", count: writing, scanned: scanned.writing, tab: "web" },
    { icon: AlertTriangle, label: "Overall Threats", count: threats, scanned: scanned.threats, tab: "threats" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {items.map(({ icon: Icon, label, count, scanned, tab }) => (
        <Link
          key={label}
          to={`/dashboard/monitoring?tab=${tab}`}
          className="glass-card rounded-2xl border border-border/30 p-4 hover:border-primary/40 transition-colors flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <Icon className="w-5 h-5 text-primary" />
            <span
              className={`text-2xl font-display font-bold ${label === "Overall Threats" && count > 0 ? "text-destructive" : "text-foreground"}`}
            >
              {count}
            </span>
          </div>
          <div className="text-xs font-body text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-[10px] font-body text-muted-foreground/80">
            {scanned.toLocaleString()} scanned
          </div>
        </Link>
      ))}
    </motion.div>
  );
};

export default DetectionPanels;
