import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, User, FileText, Receipt, ScanFace, Palette, Shield, Wand2, ShieldAlert } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const tools = [
  {
    icon: FileText,
    title: "Contract Generator",
    description: "Create legally-binding contracts for likeness usage, licensing, and permissions.",
    link: "/tools/contracts",
    status: "active" as const,
  },
  {
    icon: Receipt,
    title: "Invoice Builder",
    description: "Build professional invoices for your creative and performance work.",
    link: "/tools/invoices",
    status: "active" as const,
  },
  {
    icon: ScanFace,
    title: "Digital Likeness Scanner",
    description: "Scan the web for unauthorized use of your registered likeness.",
    link: "/dashboard/monitor",
    status: "active" as const,
  },
  {
    icon: Shield,
    title: "DMCA Takedown Assistant",
    description: "Generate DMCA takedown notices for unauthorized use of your likeness.",
    link: "/tools/dmca",
    status: "active" as const,
  },
  {
    icon: Palette,
    title: "Media Kit Builder",
    description: "Create a shareable media kit with your verified credentials and assets.",
    link: "/tools/media-kit",
    status: "active" as const,
  },
  {
    icon: Wand2,
    title: "Face Claim Wizard",
    description: "3-step guided flow to generate DMCA notices, cease & desist letters, and platform reports — pre-filled with your registered data.",
    link: "/tools/face-claim",
    status: "pro" as const,
  },
  {
    icon: ShieldAlert,
    title: "AI Consent Contract Checker",
    description: "Paste any contract — our AI flags overly broad likeness rights, missing compensation, AI-training loopholes, and more.",
    link: "/tools/contract-checker",
    status: "pro" as const,
  },
];

const Tools = () => {
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
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-4">AI Tools</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful AI-powered tools to help you create, protect, and manage your digital presence.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tools.map((tool) => (
              <Link key={tool.title} to={tool.link}>
                <Card className="glass-card border-border/30 hover:border-primary/40 transition-all group cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <tool.icon className="w-6 h-6 text-primary" />
                      </div>
                      {tool.status === "pro" ? (
                        <Badge className="bg-[#C0392B] text-white text-xs">Pro</Badge>
                      ) : (
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">{tool.title}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default Tools;
