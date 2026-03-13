import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, User } from "lucide-react";

const AvatarCreator = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container px-4 pt-24 pb-16 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/tools"><ArrowLeft className="w-4 h-4 mr-1" /> Back to Tools</Link>
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-3xl font-bold">Avatar Creator</h1>
          <Badge className="bg-accent text-accent-foreground">Beta</Badge>
        </div>
        <p className="text-muted-foreground mb-8">Generate AI-safe digital avatars from your registered likeness assets.</p>

        <Card className="p-8 text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
            <User className="w-12 h-12 text-primary" />
          </div>
          <div className="max-w-md mx-auto space-y-3">
            <h2 className="font-display text-xl font-semibold text-foreground">Coming in Beta</h2>
            <p className="text-sm text-muted-foreground">
              The Avatar Creator will let you generate AI-safe digital avatars from your verified likeness assets.
              These avatars can be used as your digital representatives while protecting your actual likeness.
            </p>
            <p className="text-sm text-muted-foreground">
              Upload your registered photos and we'll generate stylized avatars that maintain your recognizable features
              without exposing your real likeness to AI training datasets.
            </p>
          </div>

          <div className="border-2 border-dashed border-border rounded-lg p-8 max-w-sm mx-auto">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Avatar generation coming soon</p>
          </div>

          <Button disabled className="opacity-50">Generate Avatar (Coming Soon)</Button>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default AvatarCreator;
