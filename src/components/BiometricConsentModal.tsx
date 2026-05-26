import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onConsented: () => void;
  onCancel?: () => void;
}

const BiometricConsentModal = ({ open, onConsented, onCancel }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user || !c1 || !c2) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ consent_given: true, consent_date: new Date().toISOString() })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save consent", description: error.message, variant: "destructive" });
      return;
    }
    onConsented();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent className="max-w-lg" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-2">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <DialogTitle className="font-display text-xl">Biometric Scanning Consent</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            By clicking Agree, you authorize ClaimMyFace to scan the internet for unauthorized use of your face,
            voice, name, and likeness using the information you have provided. This scan may include social media
            platforms, video hosting sites, image search engines, and web pages. You can revoke this consent at
            any time in Settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="flex gap-3 items-start cursor-pointer">
            <Checkbox checked={c1} onCheckedChange={(v) => setC1(!!v)} className="mt-1" />
            <span className="text-sm text-foreground">I consent to ClaimMyFace scanning for my likeness.</span>
          </label>
          <label className="flex gap-3 items-start cursor-pointer">
            <Checkbox checked={c2} onCheckedChange={(v) => setC2(!!v)} className="mt-1" />
            <span className="text-sm text-foreground">I am the rightful owner of the identity I have registered.</span>
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
          <Button onClick={submit} disabled={!c1 || !c2 || saving}>
            {saving ? "Saving…" : "Agree & Start Scanning"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricConsentModal;
