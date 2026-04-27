import { Shield } from "lucide-react";

const DashboardTrustFooter = () => (
  <div className="rounded-xl border border-primary/20 bg-card/60 backdrop-blur-sm p-5 mt-4 flex gap-3 items-start">
    <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
      <span className="font-semibold text-foreground">🔒 ClaimMyFace Security Promise:</span>{" "}
      Your face data, profile information, and registration records are encrypted, privately
      stored, and 100% yours. We will never sell your data, share it without consent, or use it
      to train AI. Delete your account and all data anytime from Settings.
    </p>
  </div>
);

export default DashboardTrustFooter;
