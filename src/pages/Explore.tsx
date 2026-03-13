import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ShieldCheck, Star, Filter } from "lucide-react";
import Navbar from "@/components/landing/Navbar";

const categories = ["All", "Voice Artist", "Actor", "Model", "Speaker", "Freelancer"];

const mockCreators = [
  { id: 1, name: "Maya Chen", category: "Voice Artist", rating: 4.9, licenses: 234, verified: true, avatar: "MC", price: "$150/license", bio: "Professional voice artist with 10+ years in animation and advertising." },
  { id: 2, name: "James Rodriguez", category: "Actor", rating: 4.8, licenses: 189, verified: true, avatar: "JR", price: "$300/license", bio: "Film and commercial actor. SAG-AFTRA member." },
  { id: 3, name: "Aisha Okonkwo", category: "Speaker", rating: 5.0, licenses: 312, verified: true, avatar: "AO", price: "$200/license", bio: "TEDx speaker and corporate keynote presenter." },
  { id: 4, name: "Liam Foster", category: "Freelancer", rating: 4.7, licenses: 97, verified: false, avatar: "LF", price: "$75/license", bio: "Digital content creator and brand ambassador." },
  { id: 5, name: "Sofia Ivanova", category: "Voice Artist", rating: 4.9, licenses: 156, verified: true, avatar: "SI", price: "$180/license", bio: "Multilingual voice talent. 6 languages." },
  { id: 6, name: "Kai Nakamura", category: "Actor", rating: 4.6, licenses: 78, verified: true, avatar: "KN", price: "$250/license", bio: "Motion capture and performance artist." },
  { id: 7, name: "Elena Vasquez", category: "Model", rating: 4.8, licenses: 203, verified: true, avatar: "EV", price: "$350/license", bio: "Fashion and commercial model. Global campaigns." },
  { id: 8, name: "David Kim", category: "Speaker", rating: 4.5, licenses: 64, verified: false, avatar: "DK", price: "$100/license", bio: "Tech industry speaker and podcast host." },
  { id: 9, name: "Nadia Petrova", category: "Voice Artist", rating: 4.9, licenses: 287, verified: true, avatar: "NP", price: "$200/license", bio: "Audiobook narrator and commercial voice talent." },
];

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");

  const filtered = mockCreators
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.bio.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === "All" || c.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.licenses - a.licenses;
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "newest") return b.id - a.id;
      return 0;
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Explore Creators</h1>
          <p className="text-muted-foreground mb-8">Find and license verified talent for your AI projects</p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search creators..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="font-display text-xs"
              >
                {cat === "All" && <Filter className="w-3 h-3 mr-1" />}
                {cat}
              </Button>
            ))}
          </div>

          {/* Results */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((creator, i) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-lg">
                    {creator.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-foreground truncate">{creator.name}</span>
                      {creator.verified && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                    </div>
                    <span className="text-sm text-muted-foreground">{creator.category}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{creator.bio}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-medium text-foreground">{creator.rating}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{creator.licenses} licenses</Badge>
                  </div>
                  <span className="text-sm font-display font-semibold text-primary">{creator.price}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No creators found matching your criteria.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Explore;
