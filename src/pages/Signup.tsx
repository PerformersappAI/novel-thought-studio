import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, User, Building2 } from "lucide-react";
import { motion } from "framer-motion";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"creator" | "business" | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Will connect to Supabase auth later
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="glass-card rounded-xl p-8 glow-blue">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">LikenessVault</span>
          </div>
          <p className="text-muted-foreground text-sm mb-8">Create your account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selection */}
            <div className="space-y-2">
              <Label>I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("creator")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                    role === "creator" ? "border-primary bg-primary/10 glow-blue" : "border-border hover:border-primary/40"
                  }`}
                >
                  <User className={`w-6 h-6 ${role === "creator" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${role === "creator" ? "text-primary" : "text-muted-foreground"}`}>Creator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("business")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                    role === "business" ? "border-accent bg-accent/10 glow-gold" : "border-border hover:border-accent/40"
                  }`}
                >
                  <Building2 className={`w-6 h-6 ${role === "business" ? "text-accent" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${role === "business" ? "text-accent" : "text-muted-foreground"}`}>Business</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full font-display" disabled={!role}>Create Account</Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
