import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Upload, FileText, Settings, Users, CheckSquare, ScrollText, LogOut, Radar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

const performerLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/assets", icon: Upload, label: "My Assets" },
  { to: "/dashboard/certificates", icon: FileText, label: "Certificates" },
  { to: "/dashboard/verification", icon: CheckSquare, label: "Verification" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const adminLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/review", icon: CheckSquare, label: "Review Queue" },
  { to: "/dashboard/users", icon: Users, label: "Users" },
  { to: "/dashboard/legal", icon: ScrollText, label: "Legal Logs" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { role, signOut, user } = useAuth();
  const links = role === "admin" ? adminLinks : performerLinks;

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-border/30 bg-card/40 backdrop-blur-sm hidden lg:flex flex-col">
        <div className="p-6 border-b border-border/30">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Replica Shield" className="h-8 w-auto" />
          </Link>
          {role && (
            <span className="text-xs text-muted-foreground mt-1 block capitalize">{role} Account</span>
          )}
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
        <div className="p-4 border-t border-border/30 space-y-1">
          <div className="px-4 py-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
