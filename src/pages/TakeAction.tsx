import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  FileSearch,
  Mic,
  BadgeCheck,
  IdCard,
  UserX,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SituationKey =
  | "found-face"
  | "review-contract"
  | "voice-misuse"
  | "share-verified"
  | "build-kit"
  | "fake-profile";

const SITUATIONS: { key: SituationKey; icon: any; label: string }[] = [
  { key: "found-face", icon: ShieldAlert, label: "I found my face used without permission" },
  { key: "review-contract", icon: FileSearch, label: "I need to review a contract before signing" },
  { key: "voice-misuse", icon: Mic, label: "Someone is using my voice without permission" },
  { key: "share-verified", icon: BadgeCheck, label: "I want to share my verified status" },
  { key: "build-kit", icon: IdCard, label: "I need to build my media kit" },
  { key: "fake-profile", icon: UserX, label: "I want to report a fake profile using my photos" },
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
    id: "cease-desist",
    title: "Generate a Cease & Desist Letter",
    whenToUse:
      "Use this when you want to send a formal legal warning before filing a DMCA or taking legal action.",
    to: "/dashboard/action/cease-desist",
    cta: "Generate Letter",
    triggers: ["found-face", "voice-misuse"],
  },
  {
    id: "face-claim",
    title: "Full Face Claim — All Three Documents",
    whenToUse:
      "Use this when you want to take full action — DMCA notice, cease & desist, AND platform report — all at once.",
    to: "/tools/face-claim",
    cta: "Start Full Face Claim",
    triggers: ["found-face"],
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
];

const TakeAction = () => {
  const [activeSituation, setActiveSituation] = useState<SituationKey | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
          <p className="text-muted-foreground mt-1">What do you need to do right now?</p>
        </header>

        {/* Situation selector */}
        <section>
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

        {/* SAG-AFTRA / Guild Resources */}
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-6 space-y-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Need Guild Support?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              If you're a SAG-AFTRA member, your union has resources to help you fight unauthorized use of your likeness.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <a
              href="https://www.sagaftra.org/contracts-industry-resources/contract-resources/ai-resources"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border/30 bg-card/40 p-4 hover:bg-card/60 transition-colors block"
            >
              <div className="font-semibold text-sm text-foreground mb-1">SAG-AFTRA AI Resources</div>
              <p className="text-xs text-muted-foreground">Official guidance on AI & digital likeness protections for performers.</p>
            </a>
            <a
              href="https://www.sagaftra.org/membership-benefits/member-services"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-border/30 bg-card/40 p-4 hover:bg-card/60 transition-colors block"
            >
              <div className="font-semibold text-sm text-foreground mb-1">Contact Member Services</div>
              <p className="text-xs text-muted-foreground">Reach SAG-AFTRA directly for help with violations or contract disputes.</p>
            </a>
          </div>

          <div className="rounded-xl bg-card/30 border border-border/20 p-4">
            <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">When to contact the guild vs. handle it yourself</div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="text-primary font-bold shrink-0">→</span>
                <span><strong className="text-foreground">Handle yourself:</strong> Single social media post, fan account, or small website using your photo. Use our DMCA or takedown tools above.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent font-bold shrink-0">→</span>
                <span><strong className="text-foreground">Contact the guild:</strong> A production company, AI platform, or commercial entity is using your likeness for profit without consent. This is where union support makes a difference.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            Not a guild member? You can still use all ClaimMyFace tools above. Your face registration certificate provides legal proof of ownership regardless of union status.
          </p>
        </section>
      </motion.div>
    </DashboardLayout>
  );
};

export default TakeAction;
