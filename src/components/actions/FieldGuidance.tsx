import { ReactNode, useState } from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FieldGuidanceProps {
  label: string;
  field: string;
  required?: boolean;
  /** Bullet-point hints shown under the field. */
  hints: string[];
  /** Example text the user can click to apply. */
  example?: string;
  children: ReactNode; // the input/textarea
  /** Context for the AI assistant. */
  actionType: "dmca" | "cease-desist" | "report" | "removal";
  finding?: Record<string, unknown>;
  formValues?: Record<string, string>;
  owner?: Record<string, string | null | undefined>;
  /** Called when the AI returns text. */
  onAiFill: (text: string) => void;
}

const FieldGuidance = ({
  label,
  field,
  required,
  hints,
  example,
  children,
  actionType,
  finding,
  formValues,
  owner,
  onAiFill,
}: FieldGuidanceProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const helpWrite = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("action-assistant", {
        body: { mode: "field", actionType, field, finding, formValues, owner },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.text) onAiFill(data.text);
    } catch (e: any) {
      toast({ title: "AI assist failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-primary">*</span>}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={helpWrite}
          disabled={loading}
          className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Help me write
        </Button>
      </div>
      {children}
      {hints.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5 pl-1">
          {hints.map((h, i) => (
            <li key={i} className="flex gap-1.5">
              <Info className="w-3 h-3 mt-0.5 shrink-0 text-primary/60" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
      {example && (
        <button
          type="button"
          onClick={() => onAiFill(example)}
          className="text-xs text-primary/80 hover:text-primary underline underline-offset-2"
        >
          Use example: "{example.length > 60 ? example.slice(0, 60) + "…" : example}"
        </button>
      )}
    </div>
  );
};

export default FieldGuidance;
