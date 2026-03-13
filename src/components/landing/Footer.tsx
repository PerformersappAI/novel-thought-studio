import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/30 py-12">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">Replica Shield</span>
            <span className="text-[10px] text-muted-foreground tracking-widest mt-1">TM</span>
          </Link>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link to="/signup" className="hover:text-foreground transition-colors">Register</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Replica Shield™. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
