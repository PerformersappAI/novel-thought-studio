import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import LegalAgreementGate from "@/components/LegalAgreementGate";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      setOnboarded(true);
      return;
    }
    let cancelled = false;
    setChecking(true);
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user || authData.user.id !== user.id) {
        if (!cancelled) setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!cancelled) {
        if (error) console.warn("ProtectedRoute profile check failed:", error);
        setOnboarded(error || !data ? true : !!data.onboarding_complete);
        setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || (user && checking)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Send first-time users into the 3-step welcome flow (but don't loop on /welcome itself)
  if (!onboarded && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace />;
  }

  return <LegalAgreementGate>{children}</LegalAgreementGate>;
};

export default ProtectedRoute;
