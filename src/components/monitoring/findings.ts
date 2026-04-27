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

export type FindingMediaType = "image" | "video" | "audio" | "article";

export type RecommendedAction =
  | "File DMCA Notice"
  | "Send Cease & Desist"
  | "Report to Platform"
  | "Request Removal"
  | "Dismiss";

export interface ActionHistoryEntry {
  date: string; // ISO
  action: string;
  note?: string;
}

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
  recommended: RecommendedAction;
  /** What kind of media this finding represents — drives the preview component. */
  mediaType: FindingMediaType;
  /** Direct image / video poster / article OG-image URL to render inline. */
  thumbnailUrl?: string;
  /** Audio file URL for voice-clone findings. */
  audioUrl?: string;
  /** Short excerpt for article findings. */
  excerpt?: string;
  /** Optional match label so visually-similar results aren't interchangeable. */
  matchLabel?: string;
  /** Per-finding action history (DMCA filed, replied, etc). */
  actionHistory?: ActionHistoryEntry[];
}

export const STATUS_STYLES: Record<FindingStatus, { dot: string; pill: string; label: string; tooltip: string }> = {
  "New Alert": {
    dot: "bg-primary",
    pill: "bg-primary/15 text-primary border-primary/40",
    label: "🔴 New Alert",
    tooltip: "We just found this. No action has been taken yet.",
  },
  "Under Review": {
    dot: "bg-[hsl(43_70%_54%)]",
    pill: "bg-[hsl(43_70%_54%)]/15 text-[hsl(43_70%_54%)] border-[hsl(43_70%_54%)]/40",
    label: "🟡 Under Review",
    tooltip: "Our team is verifying this match before recommending action.",
  },
  "Takedown Filed": {
    dot: "bg-blue-500",
    pill: "bg-blue-500/15 text-blue-400 border-blue-500/40",
    label: "🔵 Takedown Filed",
    tooltip: "A DMCA or removal notice has been sent. Awaiting platform response.",
  },
  Resolved: {
    dot: "bg-emerald-500",
    pill: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
    label: "✅ Resolved",
    tooltip: "Content removed or marked as fine. No further action needed.",
  },
  Informational: {
    dot: "bg-muted-foreground",
    pill: "bg-muted/40 text-muted-foreground border-border",
    label: "ℹ️ Informational",
    tooltip: "Legitimate mention — included for transparency, no action needed.",
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

// Realistic-looking placeholder media URLs (Unsplash) so the demo doesn't show empty squares.
const IMG = {
  portrait1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
  portrait2: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80",
  portrait3: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80",
  videoPoster: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&q=80",
  ad: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80",
  article: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
  casting: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80",
  fbProfile: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&q=80",
  audioWave: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
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
    mediaType: "image",
    thumbnailUrl: IMG.portrait1,
    matchLabel: "Match #1",
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
    mediaType: "video",
    thumbnailUrl: IMG.videoPoster,
    matchLabel: "Match #2",
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
    mediaType: "image",
    thumbnailUrl: IMG.casting,
    matchLabel: "Match #3",
    actionHistory: [
      { date: days(2), action: "Match verified by review team" },
    ],
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
    mediaType: "image",
    thumbnailUrl: IMG.ad,
    matchLabel: "Match #4",
    actionHistory: [
      { date: days(5), action: "DMCA notice filed", note: "Sent to Shutterstock DMCA agent" },
      { date: days(2), action: "Awaiting platform response", note: "Typical SLA: 24–48 hours" },
    ],
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
    mediaType: "audio",
    thumbnailUrl: IMG.audioWave,
    audioUrl: "https://www.kozco.com/tech/piano2.wav",
    matchLabel: "Voice Match #1",
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
    mediaType: "article",
    thumbnailUrl: IMG.article,
    excerpt: "…praised the performer's commanding screen presence in their latest role, calling it a 'breakout moment' for the rising actor…",
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
    mediaType: "image",
    thumbnailUrl: IMG.portrait2,
    matchLabel: "Match #5",
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
    mediaType: "image",
    thumbnailUrl: IMG.fbProfile,
    matchLabel: "Match #6",
    actionHistory: [
      { date: days(28), action: "Reported to Facebook" },
      { date: days(20), action: "Profile removed by platform", note: "Confirmed via re-scan" },
      { date: days(15), action: "Marked Resolved" },
    ],
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
    mediaType: "image",
    thumbnailUrl: IMG.portrait3,
    matchLabel: "Match #7",
  },
];

/** Look up by id (for action pages opened via ?findingId=…) */
export const findFinding = (id: string | null): Finding | undefined =>
  id ? MOCK_FINDINGS.find((f) => f.id === id) : undefined;
