import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { LogOut, Home, UserCircle, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/cmf-shield-logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 h-14 border-b border-border/30 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="ClaimMyFace" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link to="/dashboard/profile" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <UserCircle className="w-4 h-4" />
            <span className="hidden sm:inline">My Profile</span>
          </Link>
          <Link to="/dashboard/settings" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
          <button onClick={signOut} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
