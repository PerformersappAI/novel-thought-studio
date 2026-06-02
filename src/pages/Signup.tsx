import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import StepIndicator from "@/components/StepIndicator";
import logo from "@/assets/cmf-shield-logo.png";

const PROFESSIONS = ["Actor", "Model", "Influencer", "CEO", "Executive", "Lawyer", "Doctor", "Athlete", "Musician", "Politician", "Public Figure", "Other"];

const Signup = () => {
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] = useState<"performer" | "producer">("performer");
  const [profession, setProfession] = useState<string>("Actor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [stageName, setStageName] = useState("");
  const [unionAffiliation, setUnionAffiliation] = useState("non-union");
  const [companyName, setCompanyName] = useState("");
  const [productionType, setProductionType] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"" | "valid" | "invalid">("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await signUp(email, password, fullName, {
      account_type: accountType,
      profession,
      stage_name: stageName,
      union_affiliation: unionAffiliation,
      company_name: companyName,
      production_type: productionType,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email for confirmation, or sign in directly." });
      navigate("/welcome");
    }
  };

  const canProceedStep0 = accountType !== undefined;
  const canProceedStep1 = fullName.trim() && email.trim() && password.length >= 8;
  const canProceedStep2 = accountType === "producer" ? companyName.trim() : true;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-[120px]" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg mx-4 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <StepIndicator currentStep={0} className="mb-8" />

        <div className="glass-card rounded-xl p-8 glow-blue">
          <img src={logo} alt="ClaimMyFace" className="h-10 w-auto mb-2" />
          
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-muted-foreground text-sm mb-2">Step 1: Choose your account type</p>
                <p className="text-xs text-muted-foreground mb-6">Select how you'll use ClaimMyFace.</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setAccountType("performer")}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      accountType === "performer"
                        ? "border-primary bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.3)]"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="font-display font-semibold text-foreground mb-1">Individual</div>
                    <p className="text-xs text-muted-foreground">Protect your own face, voice & likeness — for actors, creators, executives, lawyers, and anyone with a public presence.</p>
                  </button>
                  <button
                    onClick={() => setAccountType("producer")}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      accountType === "producer"
                        ? "border-primary bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.3)]"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className="font-display font-semibold text-foreground mb-1">Enterprise</div>
                    <p className="text-xs text-muted-foreground">For larger companies protecting multiple people. Click here to get more information.</p>
                  </button>
                </div>

                {accountType === "performer" && (
                  <div className="space-y-2 mb-6">
                    <Label>Your Profession / How You're Known</Label>
                    <Select value={profession} onValueChange={setProfession}>
                      <SelectTrigger><SelectValue placeholder="Select your profession" /></SelectTrigger>
                      <SelectContent>
                        {PROFESSIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {accountType === "producer" ? (
                  <Button onClick={() => navigate("/enterprise")} className="w-full font-display">
                    Get more information <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => setStep(1)} disabled={!canProceedStep0} className="w-full font-display">
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-muted-foreground text-sm mb-2">Step 2: Create your account</p>
                <p className="text-xs text-muted-foreground mb-6">Fill in your details below.</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Legal Name</Label>
                    <Input id="fullName" placeholder="Your full legal name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    <p className="text-xs text-muted-foreground">Must match your government-issued ID.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded-md"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(0)} className="font-display">Back</Button>
                    <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="flex-1 font-display">
                      Continue <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-muted-foreground text-sm mb-2">Step 3: {accountType === "performer" ? "Performer" : "Producer"} details</p>
                <p className="text-xs text-muted-foreground mb-6">
                  {accountType === "performer" ? "Tell us about your performance career." : "Tell us about your production company."}
                </p>
                <div className="space-y-4">
                  {accountType === "performer" ? (
                    <>
                      <div className="space-y-2">
                        <Label>Stage Name (optional)</Label>
                        <Input value={stageName} onChange={(e) => setStageName(e.target.value)} placeholder="Your stage or professional name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Union Affiliation</Label>
                        <Select value={unionAffiliation} onValueChange={setUnionAffiliation}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="non-union">Non-Union</SelectItem>
                            <SelectItem value="union-member">Union Member</SelectItem>
                            <SelectItem value="fi-core">Fi-Core</SelectItem>
                            <SelectItem value="aea">AEA (Actors' Equity)</SelectItem>
                            <SelectItem value="actra">ACTRA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your production company" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Production Type</Label>
                        <Select value={productionType} onValueChange={setProductionType}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="film">Film</SelectItem>
                            <SelectItem value="television">Television</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="gaming">Gaming</SelectItem>
                            <SelectItem value="ai_training">AI / Training Data</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} className="font-display">Back</Button>
                    <Button onClick={handleSubmit} disabled={loading || !canProceedStep2} className="flex-1 font-display">
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
