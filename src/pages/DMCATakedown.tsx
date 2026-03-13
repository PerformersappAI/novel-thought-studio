import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, Copy, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DMCATakedown = () => {
  const { toast } = useToast();
  const location = useLocation();
  const prefill = (location.state as any) || {};
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    ownerName: "",
    ownerAddress: "",
    infringingUrl: prefill.infringingUrl || "",
    originalWorkDescription: "",
    ownershipProof: "",
  });

  const handleGenerate = async () => {
    if (!form.ownerName || !form.infringingUrl || !form.originalWorkDescription) {
      toast({ title: "Missing fields", description: "Please fill in required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-dmca", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setNotice(data.notice);
      toast({ title: "DMCA notice generated!" });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(notice);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools</Link>
        </Button>
        <h1 className="font-display text-3xl font-bold mb-2">DMCA Takedown Assistant</h1>
        <p className="text-muted-foreground mb-8">Generate DMCA takedown notices for unauthorized use of your likeness.</p>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 space-y-4">
            <Input placeholder="Your full legal name *" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
            <Input placeholder="Your address (optional)" value={form.ownerAddress} onChange={(e) => setForm({ ...form, ownerAddress: e.target.value })} />
            <Input placeholder="Infringing URL(s) *" value={form.infringingUrl} onChange={(e) => setForm({ ...form, infringingUrl: e.target.value })} />
            <Textarea placeholder="Describe your original work *" value={form.originalWorkDescription} onChange={(e) => setForm({ ...form, originalWorkDescription: e.target.value })} className="resize-none" />
            <Textarea placeholder="Proof of ownership (optional)" value={form.ownershipProof} onChange={(e) => setForm({ ...form, ownershipProof: e.target.value })} className="resize-none" />
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
              {loading ? "Generating…" : "Generate DMCA Notice"}
            </Button>
          </Card>

          <Card className="p-6">
            {notice ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-semibold">DMCA Notice</h3>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="w-3 h-3 mr-1" /> Copy</Button>
                </div>
                <div className="prose prose-sm prose-invert max-w-none max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm text-foreground/90 bg-secondary/30 rounded-lg p-4">
                  {notice}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Fill in the form and generate your DMCA notice.
              </div>
            )}
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DMCATakedown;
