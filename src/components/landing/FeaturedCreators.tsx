import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Star } from "lucide-react";

const creators = [
  { name: "Maya Chen", category: "Voice Artist", rating: 4.9, licenses: 234, verified: true, avatar: "MC" },
  { name: "James Rodriguez", category: "Actor / Model", rating: 4.8, licenses: 189, verified: true, avatar: "JR" },
  { name: "Aisha Okonkwo", category: "Speaker", rating: 5.0, licenses: 312, verified: true, avatar: "AO" },
  { name: "Liam Foster", category: "Freelancer", rating: 4.7, licenses: 97, verified: false, avatar: "LF" },
  { name: "Sofia Ivanova", category: "Voice Artist", rating: 4.9, licenses: 156, verified: true, avatar: "SI" },
  { name: "Kai Nakamura", category: "Actor", rating: 4.6, licenses: 78, verified: true, avatar: "KN" },
];

const FeaturedCreators = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Featured Creators</h2>
          <p className="text-muted-foreground text-lg">Top talent ready to license their likeness</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {creators.map((creator, i) => (
            <motion.div
              key={creator.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-lg">
                  {creator.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-foreground">{creator.name}</span>
                    {creator.verified && <ShieldCheck className="w-4 h-4 text-primary" />}
                  </div>
                  <span className="text-sm text-muted-foreground">{creator.category}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="text-sm font-medium text-foreground">{creator.rating}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{creator.licenses} licenses</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCreators;
