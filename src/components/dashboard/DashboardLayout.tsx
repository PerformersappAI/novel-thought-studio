import { ReactNode, useState } from "react";

import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, Users, CheckSquare, ScrollText, LogOut, Radar, UserCircle, Home, Menu, X, ShieldAlert, ScanSearch, Stamp, FileSearch, FileArchive, FileSignature, ShieldCheck, AlertTriangle, FileText, Siren, Microscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/cmf-shield-logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

const performerLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "My Protection" },
  { to: "/dashboard/monitoring", icon: ScanSearch, label: "Scan Results" },
  { to: "/dashboard/claim-scanner", icon: Microscope, label: "Claim Scanner" },
  { to: "/dashboard/take-action", icon: ShieldAlert, label: "Take Action" },
  { to: "/dashboard/contract-scanner", icon: FileSearch, label: "Contract Scanner" },
  { to: "/dashboard/incident-report", icon: AlertTriangle, label: "Report Violation", indicator: true },
  { to: "/dashboard/emergency", icon: Siren, label: "Emergency Response", emergency: true },
  { to: "/dashboard/profile", icon: UserCircle, label: "My Profile" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const producerLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/scan", icon: Radar, label: "Scan Registry" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const adminLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { to: "/dashboard/review", icon: CheckSquare, label: "Review Queue" },
  { to: "/dashboard/users", icon: Users, label: "Users" },
  { to: "/dashboard/violations", icon: ScrollText, label: "Violations" },
  { to: "/dashboard/legal", icon: ScrollText, label: "Legal Logs" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { role, signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === "admin" ? adminLinks : role === "producer" ? producerLinks : performerLinks;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar — always visible */}
      <header className="sticky top-0 z-40 h-14 border-b border-border/30 bg-card/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-md hover:bg-secondary/50"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="ClaimMyFace" className="h-7 w-auto" />
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            to="/dashboard/take-action"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            Take Action
          </Link>
          <Link
            to="/education"
            className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            Education
          </Link>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="w-64 border-r border-border/30 bg-card/40 backdrop-blur-sm hidden lg:flex flex-col">
          <div className="p-4 border-b border-border/30">
            {role && (
              <span className="text-xs text-muted-foreground capitalize">{role} Account</span>
            )}
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                  "emergency" in link && link.emergency
                    ? "bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90"
                    : location.pathname === link.to
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
                {"indicator" in link && link.indicator && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-destructive" />
                )}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border/30">
            <div className="px-2 py-1 text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 top-14">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-72 max-w-[85%] h-full bg-card border-r border-border/30 flex flex-col">
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {links.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                      "emergency" in link && link.emergency
                        ? "bg-destructive text-destructive-foreground font-semibold hover:bg-destructive/90"
                        : location.pathname === link.to
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                    {"indicator" in link && link.indicator && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-destructive" />
                    )}
                  </Link>
                ))}
              </nav>
              <div className="p-4 border-t border-border/30 text-xs text-muted-foreground truncate">{user?.email}</div>
            </aside>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
