import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ContractGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState("");
  const [form, setForm] = useState({
    parties: "",
    usageType: "",
    duration: "",
    territory: "",
    compensation: "",
    additionalTerms: "",
  });

  const handleGenerate = async () => {
    if (!form.parties || !form.usageType) {
      toast({ title: "Missing fields", description: "Please fill in parties and usage type.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-contract", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContract(data.contract);
      toast({ title: "Contract generated!" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contract);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools</Link>
        </Button>
        <h1 className="font-display text-3xl font-bold mb-2">Contract Generator</h1>
        <p className="text-muted-foreground mb-8">Generate legally-structured contracts for likeness usage, licensing, and permissions.</p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 space-y-4">
            <Input placeholder="Parties involved (e.g. John Doe and Acme Studios)" value={form.parties} onChange={(e) => setForm({ ...form, parties: e.target.value })} />
            <Select value={form.usageType} onValueChange={(v) => setForm({ ...form, usageType: v })}>
              <SelectTrigger><SelectValue placeholder="Usage type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="editorial">Editorial</SelectItem>
                <SelectItem value="ai_training">AI Training</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="film_tv">Film / TV</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Duration (e.g. 12 months, perpetual)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            <Input placeholder="Territory (e.g. Worldwide, United States)" value={form.territory} onChange={(e) => setForm({ ...form, territory: e.target.value })} />
            <Input placeholder="Compensation (e.g. $5,000 flat fee)" value={form.compensation} onChange={(e) => setForm({ ...form, compensation: e.target.value })} />
            <Textarea placeholder="Additional terms or notes (optional)" value={form.additionalTerms} onChange={(e) => setForm({ ...form, additionalTerms: e.target.value })} className="resize-none" />
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
              {loading ? "Generating…" : "Generate Contract"}
            </Button>
          </Card>

          <Card className="p-6">
            {contract ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-semibold">Generated Contract</h3>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="w-3 h-3 mr-1" /> Copy</Button>
                </div>
                <div className="prose prose-sm prose-invert max-w-none max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-foreground/90 bg-secondary/30 rounded-lg p-4">
                  {contract}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Fill in the form and generate your contract.
              </div>
            )}
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContractGenerator;
