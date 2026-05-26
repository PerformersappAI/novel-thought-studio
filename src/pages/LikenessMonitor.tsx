import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Loader2, ExternalLink, AlertTriangle, Clock, Upload, Image as ImageIcon, Type } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ScanHistory from "@/components/likeness/ScanHistory";
import BiometricConsentModal from "@/components/BiometricConsentModal";
import { useBiometricConsent } from "@/hooks/useBiometricConsent";
import DetectionPanels from "@/components/dashboard/DetectionPanels";

const LikenessMonitor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const consent = useBiometricConsent();
  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ legal_name: string | null; full_name: string | null; stage_name: string | null } | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [stageName, setStageName] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchScans = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("likeness_scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setScans(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchScans();
    if (user) {
      supabase
        .from("profiles")
        .select("legal_name, full_name, stage_name")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data as any));
    }
  }, [user]);

  const runTextScan = async () => {
    if (!query.trim() || !user) return;
    if (!consent.requireConsent()) return;
    setScanning(true);
    try {
      const { data: scan, error: insertError } = await supabase
        .from("likeness_scans")
        .insert({ user_id: user.id, query: query.trim(), status: "scanning", scan_type: "web_search" })
        .select().single();
      if (insertError) throw insertError;
      const { data, error } = await supabase.functions.invoke("likeness-scan", {
        body: { query: query.trim(), scanId: scan.id },
      });
      if (error) throw error;
      toast({ title: "Scan complete", description: `Found ${data?.data?.length || 0} results.` });
      setQuery("");
      await fetchScans();
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally { setScanning(false); }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please use an image under 10MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const runImageScan = async () => {
    if (!imageBase64 || !user) return;
    if (!consent.requireConsent()) return;
    setScanning(true);
    const queryLabel = name.trim() || "Image scan";
    try {
      const { data: scan, error: insertError } = await supabase
        .from("likeness_scans")
        .insert({ user_id: user.id, query: queryLabel, status: "scanning", scan_type: "image_search" })
        .select().single();
      if (insertError) throw insertError;
      const { data, error } = await supabase.functions.invoke("likeness-image-scan", {
        body: { imageBase64, scanId: scan.id, name: name.trim(), stageName: stageName.trim(), description: description.trim() },
      });
      if (error) throw error;
      toast({ title: "Image scan complete", description: `Found ${data?.data?.length || 0} matches.` });
      setImagePreview(null);
      setImageBase64(null);
      setName(""); setStageName(""); setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchScans();
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally { setScanning(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Likeness Monitor</h1>
          <p className="text-muted-foreground mt-1">Search for unauthorized use of your name or face online.</p>
        </div>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="image" className="gap-2"><ImageIcon className="w-4 h-4" /> Image Search</TabsTrigger>
            <TabsTrigger value="text" className="gap-2"><Type className="w-4 h-4" /> Text Search</TabsTrigger>
          </TabsList>

          <TabsContent value="image">
            <Card className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Upload a photo & provide details</p>
                <p className="text-xs text-muted-foreground">Adding your name and details helps us filter results to find actual matches of you.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Image upload */}
                <div className="shrink-0">
                  {imagePreview ? (
                    <div className="relative group">
                      <img src={imagePreview} alt="Selected" className="w-32 h-32 object-cover rounded-lg border border-border" />
                      <button
                        onClick={() => { setImagePreview(null); setImageBase64(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >×</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-xs">Choose photo</span>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageSelect} />
                </div>

                {/* Context fields */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input placeholder="Full name *" value={name} onChange={(e) => setName(e.target.value)} disabled={scanning} />
                    <Input placeholder="Stage name / alias (optional)" value={stageName} onChange={(e) => setStageName(e.target.value)} disabled={scanning} />
                  </div>
                  <Textarea
                    placeholder="Brief description (e.g. brunette actress, appeared in XYZ show)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={scanning}
                    className="resize-none h-20"
                  />
                  <Button onClick={runImageScan} disabled={scanning || !imageBase64} className="w-full sm:w-auto">
                    {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                    {scanning ? "Scanning…" : "Search for this face"}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="text">
            <Card className="p-6">
              <div className="flex gap-3">
                <Input placeholder="Enter your name or stage name..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runTextScan()} disabled={scanning} className="flex-1" />
                <Button onClick={runTextScan} disabled={scanning || !query.trim()}>
                  {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                  {scanning ? "Scanning…" : "Scan"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">We'll search for web pages that reference your name alongside terms like image, photo, video, deepfake, or AI.</p>
            </Card>
          </TabsContent>
        </Tabs>

        <ScanHistory scans={scans} loading={loading} onUpdate={fetchScans} profile={profile} />
      </div>
      <BiometricConsentModal
        open={consent.modalOpen}
        onConsented={consent.onConsented}
        onCancel={() => consent.setModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default LikenessMonitor;
