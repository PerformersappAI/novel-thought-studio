import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Stamp, CheckCircle2, Clock, Circle, Loader2, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","District of Columbia",
];

const TrademarkKit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [form, setForm] = useState({
    legal_name: "",
    signature_phrase: "",
    trademark_entity: "",
    state_of_formation: "",
    goods_services: "Entertainment services, namely personal appearances by a performing artist",
    international_class: "41",
    date_first_use: null as Date | null,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("signature_phrase, trademark_entity, trademark_status, stage_name, legal_name, full_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data);
      setForm((f) => ({
        ...f,
        legal_name: data?.legal_name || data?.full_name || "",
        signature_phrase: data?.signature_phrase || "",
        trademark_entity: data?.trademark_entity || "",
      }));
      setLoading(false);
    })();
  }, [user]);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const hasPhrase = !!form.signature_phrase.trim();
  const hasEntity = !!form.trademark_entity.trim();
  const isFormComplete = hasPhrase && hasEntity && !!form.legal_name.trim() && !!form.state_of_formation;

  const completedIndex = (hasPhrase ? 1 : 0) + (hasEntity ? 1 : 0);

  const STEPS = [
    { key: "phrase", title: "Define Your Sound Mark", desc: "Record or confirm your unique signature phrase that audiences associate with you." },
    { key: "entity", title: "Establish Business Entity", desc: "Create or confirm a rights-management LLC that will own your trademarks." },
    { key: "search", title: "Trademark Search", desc: "We check existing USPTO filings to make sure your mark is available." },
    { key: "file", title: "File Application", desc: "Submit your trademark application through the USPTO TEAS system." },
  ];

  const saveForm = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const newStatus = hasPhrase && hasEntity ? "in_progress" : "not_started";
    const { error } = await supabase
      .from("profiles")
      .update({
        signature_phrase: form.signature_phrase || null,
        trademark_entity: form.trademark_entity || null,
        trademark_status: newStatus,
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      setProfile((p: any) => ({ ...p, trademark_status: newStatus }));
      toast({ title: "Trademark details saved" });
    }
  }, [user, form, hasPhrase, hasEntity, toast]);

  const generatePDF = useCallback(async () => {
    setGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const w = doc.internal.pageSize.getWidth();

      // Dark header
      doc.setFillColor(11, 21, 38); // #0B1526
      doc.rect(0, 0, w, 55, "F");
      doc.setFillColor(196, 18, 48); // #C41230
      doc.rect(0, 55, w, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Trademark Kit", 20, 28);
      doc.setFontSize(10);
      doc.setTextColor(212, 168, 67); // gold
      doc.text("Prepared by ClaimMyFace — My Face. My Claim.", 20, 40);
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(`Generated: ${format(new Date(), "PPP")}`, 20, 48);

      // Body
      let y = 70;
      const labelColor = [120, 120, 140] as const;
      const valueColor = [30, 30, 40] as const;

      const addField = (label: string, value: string) => {
        doc.setFontSize(9);
        doc.setTextColor(...labelColor);
        doc.text(label, 20, y);
        y += 5;
        doc.setFontSize(11);
        doc.setTextColor(...valueColor);
        const lines = doc.splitTextToSize(value || "—", w - 40);
        doc.text(lines, 20, y);
        y += lines.length * 5 + 6;
      };

      addField("Full Legal Name", form.legal_name);
      addField("Signature Phrase / Sound Mark", form.signature_phrase);
      addField("Business Entity Name", form.trademark_entity);
      addField("State of Formation", form.state_of_formation);
      addField("Goods/Services Description", form.goods_services);
      addField("International Class", `Class ${form.international_class} — Entertainment Services`);
      addField("Date of First Use", form.date_first_use ? format(form.date_first_use, "PPP") : "Not specified");

      // Next Steps
      y += 5;
      doc.setFillColor(245, 245, 248);
      doc.roundedRect(15, y - 4, w - 30, 42, 3, 3, "F");
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 40);
      doc.text("Next Steps", 20, y + 4);
      y += 12;
      doc.setFontSize(10);
      const steps = [
        "1. Consult a trademark attorney to review your application.",
        "2. File via USPTO TEAS at https://teas.uspto.gov",
        "3. Return to ClaimMyFace to track your filing status.",
      ];
      steps.forEach((s) => {
        doc.text(s, 24, y);
        y += 7;
      });

      doc.save("ClaimMyFace-Trademark-Kit.pdf");
      toast({ title: "PDF downloaded!" });
    } catch (err: any) {
      toast({ title: "PDF generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [form, toast]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const status = profile?.trademark_status ?? "not_started";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/dashboard/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </Link>

        <div className="flex items-center gap-3">
          <Stamp className="w-8 h-8 text-accent" />
          <div>
            <h1 className="font-display text-3xl font-bold">Trademark Kit</h1>
            <p className="text-sm text-muted-foreground">Protect your name, likeness, and voice with a registered trademark.</p>
          </div>
        </div>

        {/* Current Info */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-display text-lg font-semibold">Your Trademark Details</h2>
              <Badge
                variant="outline"
                className={
                  status === "filed" ? "bg-green-600/20 text-green-400 border-green-500/30" :
                  status === "in_progress" ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30" :
                  "text-muted-foreground"
                }
              >
                {status === "filed" ? "Filed" : status === "in_progress" ? "In Progress" : "Not Started"}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground">Signature Phrase</p>
                <p className="font-medium mt-1">{form.signature_phrase || <span className="text-muted-foreground italic">Not set</span>}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground">Business Entity</p>
                <p className="font-medium mt-1">{form.trademark_entity || <span className="text-muted-foreground italic">Not set</span>}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filing Roadmap */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-1">
            <h2 className="font-display text-lg font-semibold mb-4">Filing Roadmap</h2>
            <div className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i < completedIndex;
                const active = i === completedIndex && completedIndex < 4;
                return (
                  <div key={step.key} className="flex gap-3 items-start">
                    <div className="mt-0.5">
                      {done ? (
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                      ) : active ? (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${done ? "text-green-400" : active ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Trademark Kit Form */}
        <Card className="glass-card border-border/30">
          <CardContent className="p-6 space-y-5">
            <h2 className="font-display text-lg font-semibold">Generate Your Trademark Kit</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Full Legal Name</Label>
                <Input value={form.legal_name} onChange={(e) => update("legal_name", e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Signature Phrase / Sound Mark</Label>
                <Input
                  placeholder="Hey it's [Your Name]"
                  value={form.signature_phrase}
                  onChange={(e) => update("signature_phrase", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Business Entity Name</Label>
                <Input
                  placeholder="[Name] Rights Management LLC"
                  value={form.trademark_entity}
                  onChange={(e) => update("trademark_entity", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>State of Formation</Label>
                <Select value={form.state_of_formation} onValueChange={(v) => update("state_of_formation", v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date of First Use</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.date_first_use && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.date_first_use ? format(form.date_first_use, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.date_first_use ?? undefined}
                      onSelect={(d) => update("date_first_use", d ?? null)}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Goods/Services Description</Label>
                <Textarea
                  value={form.goods_services}
                  onChange={(e) => update("goods_services", e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>International Class</Label>
                <Input value={`Class ${form.international_class} — Entertainment Services`} disabled />
                <p className="text-xs text-muted-foreground">Class 41 covers entertainment services including live performances, acting, and voice work. Most performers file under this class.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={saveForm} disabled={saving} variant="secondary" className="font-display">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Save Details
              </Button>
              <Button onClick={generatePDF} disabled={generating || !isFormComplete} className="font-display">
                {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
                Download My Trademark Kit PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attorney CTA */}
        <Button
          asChild
          className="w-full font-display bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        >
          <a href="https://www.americanbar.org/groups/intellectual_property_law/resources/find-a-lawyer/" target="_blank" rel="noopener noreferrer">
            Find a Trademark Attorney <ExternalLink className="w-4 h-4 ml-1" />
          </a>
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default TrademarkKit;
