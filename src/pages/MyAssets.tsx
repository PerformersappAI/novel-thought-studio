import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Plus, FileImage, FileAudio, FileVideo, FileText, Cpu, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import StepIndicator from "@/components/StepIndicator";
import { useUploadLimit } from "@/hooks/useUploadLimit";

const assetTypeIcons: Record<string, any> = {
  image: FileImage, audio: FileAudio, video: FileVideo, text: FileText, ai_model: Cpu,
};

const MyAssets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assets, setAssets] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assetType, setAssetType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    if (!user) return;
    const { data } = await supabase.from("registry_assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setAssets(data ?? []);
  };

  useEffect(() => { fetchAssets(); }, [user]);

  const computeHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !assetType) return;
    setUploading(true);
    try {
      const fileHash = await computeHash(file);
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("assets").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("registry_assets").insert({
        user_id: user.id, title, description, asset_type: assetType as any,
        file_url: filePath, file_hash: fileHash, file_size_bytes: file.size, mime_type: file.type,
      });
      if (insertError) throw insertError;
      toast({ title: "Asset submitted!", description: "Your asset is now pending review." });
      setShowUpload(false); setTitle(""); setDescription(""); setAssetType(""); setFile(null);
      fetchAssets();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-accent/10 text-accent", approved: "bg-primary/10 text-primary",
    rejected: "bg-destructive/10 text-destructive", revision_requested: "bg-accent/10 text-accent",
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">My Assets</h1>
            <p className="text-muted-foreground mt-1">Register and manage your likeness assets</p>
          </div>
          <Button onClick={() => setShowUpload(!showUpload)} className="font-display">
            <Plus className="w-4 h-4 mr-1" /> New Asset
          </Button>
        </div>

        <StepIndicator currentStep={2} className="mb-8" />

        {showUpload && (
          <Card className="glass-card border-border/30 mb-8 glow-blue">
            <CardHeader>
              <CardTitle className="font-display text-lg">Step 3: Register a New Asset</CardTitle>
              <p className="text-sm text-muted-foreground">Upload your likeness asset. Each file is cryptographically hashed and timestamped for ownership proof.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g. Headshot - Front View" required />
                    <p className="text-xs text-muted-foreground">Give your asset a clear, descriptive name.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Type</Label>
                    <Select value={assetType} onValueChange={setAssetType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                        <SelectItem value="text">Written Description</SelectItem>
                        <SelectItem value="ai_model">AI Model File</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe this asset and how it represents your likeness..." />
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input ref={fileRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
                  <p className="text-xs text-muted-foreground">Supported: images, video, audio, text files, AI model files.</p>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={uploading} className="font-display">
                    {uploading ? "Uploading..." : "Submit for Review"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {assets.length === 0 ? (
            <Card className="glass-card border-border/30">
              <CardContent className="py-12 text-center">
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No assets yet. Click "New Asset" to register your first likeness asset.</p>
              </CardContent>
            </Card>
          ) : (
            assets.map((asset) => {
              const Icon = assetTypeIcons[asset.asset_type] || FileText;
              return (
                <Card key={asset.id} className="glass-card border-border/30">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{asset.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.asset_type} · {new Date(asset.created_at).toLocaleDateString()}
                          {asset.registry_id && <span className="ml-2 text-primary">#{asset.registry_id}</span>}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className={statusColors[asset.status] || ""}>{asset.status}</Badge>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MyAssets;
