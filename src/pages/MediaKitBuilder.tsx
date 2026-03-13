import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Globe, Instagram, Twitter, Youtube } from "lucide-react";

const MediaKitBuilder = () => {
  const [form, setForm] = useState({
    name: "", bio: "", title: "",
    instagram: "", twitter: "", youtube: "", website: "",
    credits: "",
    skills: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools</Link>
        </Button>
        <h1 className="font-display text-3xl font-bold mb-2">Media Kit Builder</h1>
        <p className="text-muted-foreground mb-8">Create a shareable media kit with your verified credentials and assets.</p>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Title / Role (e.g. Actor, Model)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="resize-none h-24" />
            </Card>
            <Card className="p-6 space-y-4">
              <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">Social Links</h3>
              <Input placeholder="Instagram handle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
              <Input placeholder="Twitter / X handle" value={form.twitter} onChange={(e) => setForm({ ...form, twitter: e.target.value })} />
              <Input placeholder="YouTube channel" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} />
              <Input placeholder="Website URL" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </Card>
            <Card className="p-6 space-y-4">
              <Textarea placeholder="Credits & Roles (one per line)" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} className="resize-none h-24" />
              <Textarea placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="resize-none" />
            </Card>
            <Button className="w-full" onClick={() => setShowPreview(true)}>Generate Media Kit Preview</Button>
          </div>

          <Card className="p-8">
            {showPreview && form.name ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-primary">
                    {form.name.charAt(0)}
                  </div>
                  <h2 className="font-display text-xl font-bold text-foreground">{form.name}</h2>
                  {form.title && <p className="text-sm text-primary">{form.title}</p>}
                </div>
                {form.bio && <p className="text-sm text-muted-foreground text-center">{form.bio}</p>}

                <div className="flex justify-center gap-3">
                  {form.instagram && <a href={`https://instagram.com/${form.instagram}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"><Instagram className="w-4 h-4" /></a>}
                  {form.twitter && <a href={`https://x.com/${form.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"><Twitter className="w-4 h-4" /></a>}
                  {form.youtube && <a href={form.youtube} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"><Youtube className="w-4 h-4" /></a>}
                  {form.website && <a href={form.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"><Globe className="w-4 h-4" /></a>}
                </div>

                {form.credits && (
                  <div>
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Credits</h3>
                    <ul className="text-sm text-foreground space-y-1">
                      {form.credits.split("\n").filter(Boolean).map((c, i) => <li key={i}>• {c}</li>)}
                    </ul>
                  </div>
                )}

                {form.skills && (
                  <div>
                    <h3 className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {form.skills.split(",").map((s, i) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Fill in your details and preview your media kit.
              </div>
            )}
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MediaKitBuilder;
