import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Menu } from "lucide-react";
import cmfShieldLogo from "@/assets/cmf-shield-logo.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const anchorLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const routeLinks = [
  { label: "Talent Registry", href: "/registry" },
  { label: "Education", href: "/education" },
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
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-background/70 backdrop-blur-xl">
      <div className="container px-4 h-16 flex items-center justify-between">
        {/* Left — Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={cmfShieldLogo}
            alt="ClaimMyFace shield logo"
            className="w-9 h-9 object-contain"
          />
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            ClaimMyFace
          </span>
        </Link>

        {/* Center — Nav links (desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {anchorLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleAnchorClick(link.href)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              {link.label}
            </button>
          ))}
          {routeLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right — Auth buttons (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
              <Button variant="outline" size="sm" onClick={signOut} className="font-body border-white/[0.15] hover:border-white/30">Sign Out</Button>
            </>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="font-body border-white/[0.15] hover:border-white/30">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="font-body glow-red">
                <Link to="/signup">Claim My Face →</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden flex items-center gap-3">
          {!user && (
            <Button asChild size="sm" className="font-body glow-red">
              <Link to="/signup">Claim My Face →</Link>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-card border-white/[0.08]">
              <SheetHeader>
                <SheetTitle className="font-display">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-6">
                {anchorLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleAnchorClick(link.href)}
                    className="text-left text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                  >
                    {link.label}
                  </button>
                ))}
                {routeLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setOpen(false)}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-white/[0.08] pt-4 flex flex-col gap-3">
                  {user ? (
                    <>
                      <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:text-foreground">Dashboard</Link>
                      <Button variant="outline" size="sm" onClick={() => { signOut(); setOpen(false); }} className="font-body border-white/[0.15]">Sign Out</Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" size="sm" className="font-body border-white/[0.15]">
                        <Link to="/login" onClick={() => setOpen(false)}>Sign In</Link>
                      </Button>
                      <Button asChild size="sm" className="font-body">
                        <Link to="/signup" onClick={() => setOpen(false)}>Claim My Face →</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
