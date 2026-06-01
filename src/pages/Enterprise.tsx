import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/cmf-shield-logo.png";

const Enterprise = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    teamSize: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const subject = encodeURIComponent(`Enterprise inquiry — ${form.companyName}`);
    const body = encodeURIComponent(
      `Company: ${form.companyName}\nContact: ${form.contactName}\nEmail: ${form.email}\nTeam size: ${form.teamSize}\n\n${form.message}`
    );
    window.location.href = `mailto:enterprise@claimmyface.com?subject=${subject}&body=${body}`;
    toast({ title: "Thanks!", description: "Your email client should open with your inquiry. We'll be in touch." });
    setSubmitting(false);
  };

  const canSubmit = form.companyName.trim() && form.contactName.trim() && form.email.trim();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden py-10">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-4 relative z-10">
        <Link to="/signup" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to signup
        </Link>

        <div className="glass-card rounded-xl p-8 glow-blue">
          <img src={logo} alt="ClaimMyFace" className="h-10 w-auto mb-2" />
          <h1 className="font-display text-2xl text-foreground mb-1">Enterprise inquiry</h1>
          <p className="text-sm text-muted-foreground mb-6">
            For larger companies protecting multiple people — studios, agencies, talent rosters, executive teams. Tell us a bit about your needs and we'll be in touch.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Your Name</Label>
              <Input id="contact" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teamSize">How many people do you need to protect?</Label>
              <Input id="teamSize" placeholder="e.g. 25, 100, 500+" value={form.teamSize} onChange={(e) => update("teamSize", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Tell us about your needs (optional)</Label>
              <Textarea id="message" rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} />
            </div>
            <Button type="submit" disabled={!canSubmit || submitting} className="w-full font-display">
              {submitting ? "Sending..." : "Send inquiry"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Enterprise;
