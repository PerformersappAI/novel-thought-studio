import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const categories = ["All", "Privacy", "AI Protection", "Industry News", "Guides"];

const Education = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      let query = supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

      if (activeCategory !== "All") {
        query = query.eq("category", activeCategory.toLowerCase());
      }

      const { data } = await query;
      setPosts(data ?? []);
      setLoading(false);
    };
    fetchPosts();
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Home</Link>
            </Button>
          </div>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="font-display text-3xl md:text-4xl font-bold">Education</h1>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stay informed about AI privacy, likeness protection, and industry developments.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className="font-display"
              >
                {cat}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-20">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-lg">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} to={`/education/${post.slug}`}>
                  <Card className="glass-card border-border/30 hover:border-primary/40 transition-all h-full group">
                    {post.cover_image_url && (
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={post.cover_image_url}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-5">
                      <Badge variant="secondary" className="mb-2 capitalize">{post.category}</Badge>
                      <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-3">
                        {post.author_name} · {post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Education;
