import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/education"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Education</Link>
        </Button>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : !post ? (
          <div className="text-center text-muted-foreground py-20">Post not found.</div>
        ) : (
          <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {post.cover_image_url && (
              <div className="aspect-video overflow-hidden rounded-xl mb-8">
                <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <Badge variant="secondary" className="mb-3 capitalize">{post.category}</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
            <div className="text-sm text-muted-foreground mb-8">
              {post.author_name} · {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
            </div>
            <div className="prose prose-invert max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </motion.article>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default BlogPost;
