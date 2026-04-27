import { useState } from "react";
import { Sparkles, Loader2, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AiAssistantPanelProps {
  actionType: "dmca" | "cease-desist" | "report" | "removal";
  finding?: Record<string, unknown>;
  formValues?: Record<string, string>;
  owner?: Record<string, string | null | undefined>;
  /** Suggested starter questions shown as chips. */
  suggestions?: string[];
}

const AiAssistantPanel = ({
  actionType,
  finding,
  formValues,
  owner,
  suggestions = [
    "Is this strong enough?",
    "Make it more polite",
    "What happens after I send this?",
    "Do I have a legal right to do this?",
  ],
}: AiAssistantPanelProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm your writing assistant. Ask me anything about this notice, or use the ✨ Help me write buttons next to each field.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (question: string) => {
    if (!question.trim()) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("action-assistant", {
        body: {
          mode: "chat",
          actionType,
          question,
          finding,
          formValues,
          owner,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages((m) => [...m, { role: "assistant", content: data.text || "(no response)" }]);
    } catch (e: any) {
      toast({ title: "Assistant error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card border-border/30 sticky top-20">
      <CardHeader>
        <CardTitle className="font-display text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Writing Assistant
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ask anything about this notice or how to fill it out.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm p-2.5 rounded-lg ${
                m.role === "assistant"
                  ? "bg-secondary/40 text-foreground"
                  : "bg-primary/10 text-foreground border border-primary/30 ml-6"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="text-sm p-2.5 rounded-lg bg-secondary/40 flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-full bg-secondary/40 border border-border/40 hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            placeholder="Ask a question…"
            className="resize-none h-16 text-sm"
            disabled={loading}
          />
          <Button size="icon" onClick={() => ask(input)} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiAssistantPanel;
