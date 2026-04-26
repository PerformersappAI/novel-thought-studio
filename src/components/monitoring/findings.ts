export type FindingStatus =
  | "New Alert"
  | "Under Review"
  | "Takedown Filed"
  | "Resolved"
  | "Informational";

export type FindingCategory =
  | "Social Media"
  | "Casting Platforms"
  | "Deepfakes"
  | "Ads & Commercial"
  | "News & Articles"
  | "Fake Profiles"
  | "Voice Clones";

export interface Finding {
  id: string;
  platform: string;
  finding: string;
  category: FindingCategory;
  date: string; // ISO
  lastSeen: string; // ISO
  status: FindingStatus;
  url: string;
  confidence: number; // 0-100
  recommended:
    | "File DMCA Notice"
    | "Send Cease & Desist"
    | "Report to Platform"
    | "Request Removal"
    | "Dismiss";
}

export const STATUS_STYLES: Record<FindingStatus, { dot: string; pill: string; label: string }> = {
  "New Alert": {
    dot: "bg-primary",
    pill: "bg-primary/15 text-primary border-primary/40",
    label: "🔴 New Alert",
  },
  "Under Review": {
    dot: "bg-[hsl(43_70%_54%)]",
    pill: "bg-[hsl(43_70%_54%)]/15 text-[hsl(43_70%_54%)] border-[hsl(43_70%_54%)]/40",
    label: "🟡 Under Review",
  },
  "Takedown Filed": {
    dot: "bg-blue-500",
    pill: "bg-blue-500/15 text-blue-400 border-blue-500/40",
    label: "🔵 Takedown Filed",
  },
  Resolved: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    label: "✅ Resolved",
  },
  Informational: {
    dot: "bg-muted-foreground",
    pill: "bg-muted/40 text-muted-foreground border-border",
    label: "ℹ️ Informational",
  },
};

export const FILTER_TABS = [
  "All",
  "Social Media",
  "Casting Platforms",
  "Deepfakes",
  "Ads & Commercial",
  "News & Articles",
  "Fake Profiles",
  "Voice Clones",
] as const;

const days = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};

export const MOCK_FINDINGS: Finding[] = [
  {
    id: "f1",
    platform: "Instagram",
    finding: "Fake profile using your photos: @real.you.official",
    category: "Fake Profiles",
    date: days(1),
    lastSeen: days(0),
    status: "New Alert",
    url: "https://instagram.com/real.you.official",
    confidence: 96,
    recommended: "Report to Platform",
  },
  {
    id: "f2",
    platform: "TikTok",
    finding: "Deepfake detected: AI-manipulated video of your face",
    category: "Deepfakes",
    date: days(2),
    lastSeen: days(0),
    status: "New Alert",
    url: "https://tiktok.com/@xyz/video/1234",
    confidence: 94,
    recommended: "File DMCA Notice",
  },
  {
    id: "f3",
    platform: "Actors Access",
    finding: "Your headshot appears on a casting profile not linked to you",
    category: "Casting Platforms",
    date: days(5),
    lastSeen: days(1),
    status: "Under Review",
    url: "https://actorsaccess.com/profile/unknown",
    confidence: 91,
    recommended: "Request Removal",
  },
  {
    id: "f4",
    platform: "Shutterstock",
    finding: "Unauthorized commercial use: Your face in a stock photo listing",
    category: "Ads & Commercial",
    date: days(7),
    lastSeen: days(2),
    status: "Takedown Filed",
    url: "https://shutterstock.com/image-photo/sample",
    confidence: 89,
    recommended: "Send Cease & Desist",
  },
  {
    id: "f5",
    platform: "ElevenLabs Demos",
    finding: "Voice clone detected: Audio clip matching your voice profile",
    category: "Voice Clones",
    date: days(9),
    lastSeen: days(3),
    status: "New Alert",
    url: "https://example.com/audio/clone-sample",
    confidence: 87,
    recommended: "File DMCA Notice",
  },
  {
    id: "f6",
    platform: "Variety",
    finding: "Article mentioning your name found",
    category: "News & Articles",
    date: days(14),
    lastSeen: days(14),
    status: "Informational",
    url: "https://variety.com/article/sample",
    confidence: 100,
    recommended: "Dismiss",
  },
  {
    id: "f7",
    platform: "Backstage",
    finding: "Your name listed under agent 'Unknown Talent Co.'",
    category: "Casting Platforms",
    date: days(21),
    lastSeen: days(10),
    status: "Under Review",
    url: "https://backstage.com/profile/sample",
    confidence: 92,
    recommended: "Request Removal",
  },
  {
    id: "f8",
    platform: "Facebook",
    finding: "Social media account found impersonating your profile",
    category: "Fake Profiles",
    date: days(30),
    lastSeen: days(15),
    status: "Resolved",
    url: "https://facebook.com/fake.profile",
    confidence: 88,
    recommended: "Report to Platform",
  },
  {
    id: "f9",
    platform: "Meta Ads",
    finding: "Unauthorized commercial use: Your face in a sponsored ad",
    category: "Ads & Commercial",
    date: days(4),
    lastSeen: days(0),
    status: "New Alert",
    url: "https://facebook.com/ads/library/sample",
    confidence: 93,
    recommended: "Send Cease & Desist",
  },
];
