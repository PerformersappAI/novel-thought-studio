import { Shield } from "lucide-react";

const DashboardTrustFooter = () => (
  <div className="rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm p-4 mt-8 flex gap-3 items-start">
    <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
    <p className="text-xs text-muted-foreground leading-relaxed">
      <span className="font-semibold text-foreground/90">🔒 ClaimMyFace Security Promise:</span>{" "}
      Your face data, profile information, and registration records are encrypted, privately stored, and
      100% yours. We will never sell your data, share it without consent, or use it to train AI. You can
      delete your account and all associated data at any time from Settings.
    </p>
  </div>
);

export default DashboardTrustFooter;
