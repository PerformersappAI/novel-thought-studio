import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import LegalAgreementGate from "@/components/LegalAgreementGate";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-display text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <LegalAgreementGate>{children}</LegalAgreementGate>;
};

export default ProtectedRoute;
