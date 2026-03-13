import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, LayoutDashboard, User, FileText, BarChart3, Settings, Search, Upload, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "creator" | "business";
}

const creatorLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/portfolio", icon: Upload, label: "Portfolio" },
  { to: "/dashboard/licenses", icon: FileText, label: "Licenses" },
  { to: "/dashboard/usage", icon: BarChart3, label: "Usage Tracking" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const businessLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/discover", icon: Search, label: "Discover" },
  { to: "/dashboard/licenses", icon: FileText, label: "My Licenses" },
  { to: "/dashboard/requests", icon: User, label: "Requests" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const location = useLocation();
  const links = role === "creator" ? creatorLinks : businessLinks;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border/30 bg-card/40 backdrop-blur-sm hidden lg:flex flex-col">
        <div className="p-6 border-b border-border/30">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">LikenessVault</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                location.pathname === link.to
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border/30">
          <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
