import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="font-display text-xl font-bold text-foreground">Replica Shield</span>
          <span className="text-[10px] text-muted-foreground tracking-widest mt-1">TM</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Button variant="outline" size="sm" onClick={signOut} className="font-display">Sign Out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
              <Button asChild size="sm" className="font-display">
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>
        {!user && (
          <Button asChild size="sm" className="md:hidden font-display">
            <Link to="/signup">Get Started</Link>
          </Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
