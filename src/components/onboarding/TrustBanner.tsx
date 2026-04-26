import { Shield } from "lucide-react";

const TrustBanner = () => (
  <div className="rounded-xl border border-primary/30 bg-card/60 backdrop-blur-sm p-4 flex gap-3 items-start">
    <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
      <Shield className="w-5 h-5 text-primary" />
    </div>
    <p className="text-sm text-foreground/90 leading-relaxed">
      <span className="font-semibold">🔒 Your data is yours.</span> Everything you enter here is
      encrypted, stored securely, and never sold, shared, or used for AI training. Ever.{" "}
      <span className="text-muted-foreground">
        ClaimMyFace exists to protect you — not to profit from your data.
      </span>
    </p>
  </div>
);

export default TrustBanner;
