import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const anchorLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Trust", href: "#trust" },
  { label: "Pricing", href: "#pricing" },
];

const routeLinks = [
  { label: "Education", href: "/education" },
  { label: "Tools", href: "/tools" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleAnchorClick = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container px-4 h-16 flex items-center justify-between">
        {/* Left — Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {anchorLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleAnchorClick(link.href)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display"
            >
              {link.label}
            </button>
          ))}
          {routeLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Center — Brand name */}
        <Link to="/" className="hidden md:block font-display font-bold text-lg tracking-tight">
          <span className="text-gradient-blue">Replica</span>{" "}
          <span className="text-gradient-gold">Shield</span>
        </Link>

        {/* Right — Auth buttons (desktop) */}
        <div className="hidden md:flex items-center gap-4">
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

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center justify-between w-full">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle className="font-display">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {anchorLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleAnchorClick(link.href)}
                    className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors font-display"
                  >
                    {link.label}
                  </button>
                ))}
                {routeLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-display"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-border/30 pt-4 flex flex-col gap-3">
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
                      <Button variant="outline" size="sm" onClick={() => { signOut(); setOpen(false); }} className="font-display">Sign Out</Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
                      <Button asChild size="sm" className="font-display">
                        <Link to="/signup" onClick={() => setOpen(false)}>Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {!user && (
            <Button asChild size="sm" className="font-display">
              <Link to="/signup">Get Started</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
