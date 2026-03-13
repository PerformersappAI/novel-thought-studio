import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Save, Trash2 } from "lucide-react";

const AdminBlog = () => {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const fetchPosts = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data ?? []);
  };

  useEffect(() => { fetchPosts(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const savePost = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    if (!rest.slug) rest.slug = generateSlug(rest.title);
    if (rest.is_published && !rest.published_at) rest.published_at = new Date().toISOString();

    let error;
    if (id) {
      ({ error } = await supabase.from("blog_posts").update(rest).eq("id", id));
    } else {
      ({ error } = await supabase.from("blog_posts").insert(rest));
    }
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Saved" }); setEditing(null); fetchPosts(); }
  };

  const deletePost = async (id: string) => {
    await supabase.from("blog_posts").delete().eq("id", id);
    toast({ title: "Post deleted" });
    fetchPosts();
  };

  const newPost = () => setEditing({
    title: "", slug: "", excerpt: "", content: "", cover_image_url: "",
    author_name: "", category: "general", is_published: false, published_at: null,
  });

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Blog Management</h1>
            <p className="text-muted-foreground mt-1">Create and manage education posts</p>
          </div>
          <Button onClick={newPost} className="font-display">
            <Plus className="w-4 h-4 mr-1" /> New Post
          </Button>
        </div>

        {editing && (
          <Card className="glass-card border-border/30 glow-blue mb-6">
            <CardContent className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} placeholder="auto-generated from title" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author Name</Label>
                  <Input value={editing.author_name} onChange={(e) => setEditing({ ...editing, author_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="privacy, ai protection, guides..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input value={editing.cover_image_url || ""} onChange={(e) => setEditing({ ...editing, cover_image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea value={editing.excerpt || ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} rows={2} placeholder="Brief summary..." />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={10} />
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                <Label>Published</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={savePost} className="font-display"><Save className="w-4 h-4 mr-1" /> Save</Button>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="glass-card border-border/30">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="font-display font-semibold text-foreground">{post.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {post.category} · {post.author_name}
                    {!post.is_published && <Badge variant="secondary" className="ml-2 text-destructive">Draft</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(post)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => deletePost(post.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminBlog;
