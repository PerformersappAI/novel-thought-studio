import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  FileSearch,
  Mic,
  BadgeCheck,
  IdCard,
  Stamp,
  UserX,
  ArrowRight,
  ChevronDown,
  Copy,
  Check,
  Mail,
  Inbox,
  ExternalLink,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  getActionBin,
  removeFromActionBin,
  clearActionBin,
  subscribeActionBin,
  type ActionBinItem,
} from "@/lib/actionBin";

type SituationKey =
  | "found-face"
  | "review-contract"
  | "voice-misuse"
  | "share-verified"
  | "build-kit"
  | "fake-profile"
  | "protect-trademark";

const SITUATIONS: { key: SituationKey; icon: any; label: string }[] = [
  { key: "found-face", icon: ShieldAlert, label: "I found my face used without permission" },
  { key: "review-contract", icon: FileSearch, label: "I need to review a contract before signing" },
  { key: "voice-misuse", icon: Mic, label: "Someone is using my voice without permission" },
  { key: "share-verified", icon: BadgeCheck, label: "I want to share my verified status" },
  { key: "build-kit", icon: IdCard, label: "I need to build my media kit" },
  { key: "fake-profile", icon: UserX, label: "I want to report a fake profile using my photos" },
  { key: "protect-trademark", icon: Stamp, label: "I want to protect my name or catchphrase" },
];

type Tool = {
  id: string;
  title: string;
  whenToUse: string;
  to: string;
  cta: string;
  triggers: SituationKey[];
};

const TOOLS: Tool[] = [
  {
    id: "dmca",
    title: "File a DMCA Takedown",
    whenToUse:
      "Use this when you've found your face, photos, or likeness used somewhere online without your permission.",
    to: "/tools/dmca",
    cta: "Open DMCA Assistant",
    triggers: ["found-face", "fake-profile"],
  },
  {
    id: "contract-checker",
    title: "Check a Contract",
    whenToUse:
      "Paste any acting contract, rider, or agreement. Our AI flags clauses that give away too many AI rights before you sign.",
    to: "/tools/contract-checker",
    cta: "Open Contract Checker",
    triggers: ["review-contract"],
  },
  {
    id: "media-kit",
    title: "Build Your Verified Media Kit",
    whenToUse:
      "Create a shareable performer profile page showing your verified ClaimMyFace status, credits, and contact info.",
    to: "/tools/media-kit",
    cta: "Build Media Kit",
    triggers: ["share-verified", "build-kit"],
  },
  {
    id: "scanner",
    title: "Scan for Unauthorized Use",
    whenToUse:
      "Upload a photo and we'll search for unauthorized copies of your face across the web.",
    to: "/dashboard/monitor",
    cta: "Open Scanner",
    triggers: ["found-face", "fake-profile"],
  },
  {
    id: "trademark",
    title: "Start Your Trademark Kit",
    whenToUse:
      "Protect your name, stage name, or signature catchphrase with a trademark filing. We'll walk you through setting up your sound mark, business entity, and filing status.",
    to: "/dashboard/trademark",
    cta: "Open Trademark Kit",
    triggers: ["protect-trademark", "share-verified"],
  },
];

const REASONS: { key: string; label: string; body: (ctx: { name: string; url: string }) => string }[] = [
  {
    key: "deepfake",
    label: "Deepfake / AI-generated likeness",
    body: ({ name, url }) =>
      `I am ${name}. It has come to my attention that the content located at ${url || "[URL]"} contains a deepfake or AI-generated depiction of my face, voice, or likeness that I did not authorize.\n\nI did not grant permission for my likeness to be synthesized, altered, or distributed in this manner. This use violates my right of publicity and, where applicable, copyright in my underlying image.\n\nI request that you remove this content within 72 hours of receipt of this notice. Please confirm the removal in writing.\n\nThis request is made in good faith. I reserve all legal rights and remedies.`,
  },
  {
    key: "voice-clone",
    label: "Voice clone",
    body: ({ name, url }) =>
      `I am ${name}. The audio located at ${url || "[URL]"} appears to use a synthetic clone of my voice without my consent.\n\nMy voice is a protected personal attribute. I did not authorize its capture, modeling, or use. Please remove this content within 72 hours and confirm in writing.\n\nI reserve all legal rights and remedies.`,
  },
  {
    key: "unauthorized-avatar",
    label: "Unauthorized AI avatar",
    body: ({ name, url }) =>
      `I am ${name}. The content at ${url || "[URL]"} uses an AI avatar built from my likeness without my permission.\n\nI did not license my face, voice, or persona for avatar generation. Please remove this content within 72 hours and confirm removal in writing.\n\nI reserve all legal rights and remedies.`,
  },
  {
    key: "old-unapproved",
    label: "Old / unapproved content (interview, photo, clip)",
    body: ({ name, url }) =>
      `I am ${name}. The material at ${url || "[URL]"} was either never approved for distribution or no longer reflects content I consent to having public.\n\nI am requesting that you take this material down at your earliest convenience, and in any case within 14 days. Please confirm in writing once removed.\n\nThank you for your cooperation.`,
  },
  {
    key: "other",
    label: "Other unauthorized use",
    body: ({ name, url }) =>
      `I am ${name}. The content at ${url || "[URL]"} uses my name, image, or likeness in a way I did not authorize.\n\nPlease remove this content within 72 hours and confirm in writing.\n\nI reserve all legal rights and remedies.`,
  },
];

const TakeAction = () => {
  const [activeSituation, setActiveSituation] = useState<SituationKey | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [reasonKey, setReasonKey] = useState<string>("deepfake");
  const [targetUrl, setTargetUrl] = useState<string>(searchParams.get("url") || "");
  const [yourName, setYourName] = useState<string>(
    (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || ""
  );
  const [copied, setCopied] = useState<"subject" | "body" | "all" | null>(null);

  useEffect(() => {
    const u = searchParams.get("url");
    if (u) setTargetUrl(u);
  }, [searchParams]);

  const reason = REASONS.find((r) => r.key === reasonKey) || REASONS[0];
  const subject = useMemo(
    () => `Takedown request — unauthorized use of my likeness (${reason.label})`,
    [reason]
  );
  const body = useMemo(
    () => reason.body({ name: yourName || "[Your Name]", url: targetUrl }),
    [reason, yourName, targetUrl]
  );

  const copy = async (text: string, key: "subject" | "body" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };

  const handleSituation = (key: SituationKey) => {
    setActiveSituation((prev) => (prev === key ? null : key));
    // Auto-expand all matching tools
    const next: Record<string, boolean> = {};
    TOOLS.forEach((t) => {
      next[t.id] = t.triggers.includes(key);
    });
    setExpanded(next);
    // Scroll to first matching tool
    setTimeout(() => {
      const first = TOOLS.find((t) => t.triggers.includes(key));
      if (first) {
        document.getElementById(`tool-${first.id}`)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 80);
  };

  const visibleTools = activeSituation
    ? TOOLS.filter((t) => t.triggers.includes(activeSituation))
    : TOOLS;

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-8"
      >
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Take Action</h1>
          <p className="text-muted-foreground mt-1">
            Generate a takedown email you can copy, paste, and send yourself.
          </p>
        </header>

        {/* Copy-paste takedown email generator */}
        <section className="rounded-2xl border border-primary/30 bg-card/50 p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Takedown Email Generator</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a reason, fill in the link, then copy the email and send it from your own
                inbox to the site owner or platform abuse contact. ClaimMyFace does not send
                anything on your behalf.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Reason</span>
              <select
                value={reasonKey}
                onChange={(e) => setReasonKey(e.target.value)}
                className="mt-1 w-full rounded-md bg-background border border-border/40 px-3 py-2 text-sm"
              >
                {REASONS.map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Your name</span>
              <input
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                className="mt-1 w-full rounded-md bg-background border border-border/40 px-3 py-2 text-sm"
                placeholder="Your full name"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Source URL</span>
              <input
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="mt-1 w-full rounded-md bg-background border border-border/40 px-3 py-2 text-sm"
                placeholder="https://example.com/the-page"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border/30 bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Subject</span>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => copy(subject, "subject")}>
                  {copied === "subject" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </Button>
              </div>
              <p className="text-sm">{subject}</p>
            </div>

            <div className="rounded-lg border border-border/30 bg-background/40 p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Email body</span>
                <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => copy(body, "body")}>
                  {copied === "body" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </Button>
              </div>
              <pre className="text-sm whitespace-pre-wrap font-body leading-relaxed">{body}</pre>
            </div>

            <Button
              className="w-full sm:w-auto gap-2"
              onClick={() => copy(`Subject: ${subject}\n\n${body}`, "all")}
            >
              {copied === "all" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy entire email
            </Button>
          </div>

          <div className="rounded-md border border-border/30 bg-muted/20 p-3 text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">How to send it:</strong> Find the site's contact, abuse, or DMCA email (often in the footer or /contact page). Paste this email there from your own inbox.</p>
            <p><strong className="text-foreground">Disclaimer:</strong> This template is provided for informational purposes only and is not legal advice. For escalation, consult an attorney or your union.</p>
          </div>
        </section>

        {/* Situation selector */}
        <section>
          <h2 className="font-display text-xl md:text-2xl font-bold mb-3">Other tools</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SITUATIONS.map((s) => {
              const isActive = activeSituation === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => handleSituation(s.key)}
                  className={cn(
                    "text-left rounded-xl border p-4 flex items-start gap-3 transition-all min-h-[76px]",
                    isActive
                      ? "border-primary bg-primary/10"
                      : "border-border/40 bg-card/40 hover:bg-card/60 hover:border-border"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      isActive ? "bg-primary/20 text-primary" : "bg-secondary/50 text-foreground/80"
                    )}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium leading-snug pt-1">{s.label}</span>
                </button>
              );
            })}
          </div>
          {activeSituation && (
            <button
              onClick={() => {
                setActiveSituation(null);
                setExpanded({});
              }}
              className="text-xs text-muted-foreground hover:text-foreground mt-3 underline-offset-2 hover:underline"
            >
              Show all tools
            </button>
          )}
        </section>

        {/* Tools list */}
        <section className="space-y-3">
          <h2 className="font-display text-xl md:text-2xl font-bold">
            {activeSituation ? "Recommended for you" : "All tools"}
          </h2>

          <AnimatePresence initial={false}>
            {visibleTools.map((tool) => {
              const isOpen = !!expanded[tool.id];
              return (
                <motion.div
                  key={tool.id}
                  id={`tool-${tool.id}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="rounded-xl border border-border/30 bg-card/40 overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpanded((p) => ({ ...p, [tool.id]: !p[tool.id] }))
                    }
                    className="w-full text-left p-5 flex items-center gap-4 hover:bg-card/60 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-foreground">
                        {tool.title}
                      </div>
                      {!isOpen && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {tool.whenToUse}
                        </p>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-muted-foreground shrink-0 transition-transform",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-5 pb-5 pt-0 space-y-4 border-t border-border/20">
                          <div className="pt-4">
                            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                              When to use
                            </div>
                            <p className="text-sm text-foreground/90 leading-relaxed">
                              {tool.whenToUse}
                            </p>
                          </div>
                          <Button asChild size="lg" className="w-full sm:w-auto">
                            <Link to={tool.to}>
                              {tool.cta} <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>

        {/* Union / Guild guidance */}
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">When to Escalate to Your Union or Counsel</h2>
            <p className="text-sm text-muted-foreground mt-1">
              If you belong to a performers' union, check directly with your guild for AI and likeness-protection resources available to members.
            </p>
          </div>

          <div className="rounded-xl bg-card/30 border border-border/20 p-4">
            <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">Handle yourself vs. escalate</div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="text-primary font-bold shrink-0">→</span>
                <span><strong className="text-foreground">Handle yourself:</strong> Single social media post, fan account, or small website using your photo. Use our DMCA or takedown tools above.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-bold shrink-0">→</span>
                <span><strong className="text-foreground">Escalate:</strong> A production company, AI platform, or commercial entity is using your likeness for profit without consent. Loop in your union (if applicable) or an entertainment attorney.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Not a union member? You can still use every ClaimMyFace tool above. Your registration certificate provides legal-weight proof of ownership regardless of union status.
          </p>
        </section>
      </motion.div>
    </DashboardLayout>
  );
};

export default TakeAction;
