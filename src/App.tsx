import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PerformerDashboard from "./pages/PerformerDashboard";
import MyAssets from "./pages/MyAssets";
import Certificates from "./pages/Certificates";
import Certificate from "./pages/Certificate";
import PublicVerify from "./pages/PublicVerify";
import IdentityVerification from "./pages/IdentityVerification";
import AdminReviewQueue from "./pages/AdminReviewQueue";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import AdminLegalLogs from "./pages/AdminLegalLogs";
import AdminBlog from "./pages/AdminBlog";
import Education from "./pages/Education";
import BlogPost from "./pages/BlogPost";
import Tools from "./pages/Tools";
import TakeAction from "./pages/TakeAction";
import ContractGenerator from "./pages/ContractGenerator";
import InvoiceBuilder from "./pages/InvoiceBuilder";
import DMCATakedown from "./pages/DMCATakedown";
import MediaKitBuilder from "./pages/MediaKitBuilder";

import LikenessMonitor from "./pages/LikenessMonitor";
import Monitoring from "./pages/Monitoring";
import ClaimScanner from "./pages/ClaimScanner";
import ProtectionReport from "./pages/ProtectionReport";
import FaceClaimWizard from "./pages/FaceClaimWizard";
import ContractChecker from "./pages/ContractChecker";
import TrademarkKit from "./pages/TrademarkKit";
import ContractScannerPage from "./pages/ContractScannerPage";
import EvidencePacketPage from "./pages/EvidencePacketPage";
import IdentityStatementPage from "./pages/IdentityStatementPage";
import AIRightsPage from "./pages/AIRightsPage";
import IncidentReportPage from "./pages/IncidentReportPage";
import DmcaGeneratorPage from "./pages/DmcaGeneratorPage";
import EmergencyResponsePage from "./pages/EmergencyResponsePage";
import ReportViolation from "./pages/ReportViolation";
import PerformerProfile from "./pages/PerformerProfile";
import OnboardingWhy from "./pages/OnboardingWhy";
import OnboardingProfile from "./pages/OnboardingProfile";
import OnboardingHeadshot from "./pages/OnboardingHeadshot";
import OnboardingVoice from "./pages/OnboardingVoice";
import OnboardingCertified from "./pages/OnboardingCertified";
import OnboardingMonitoring from "./pages/OnboardingMonitoring";
import OnboardingComplete from "./pages/OnboardingComplete";
import PerformerProfileTab from "./pages/PerformerProfileTab";
import DmcaAction from "./pages/actions/DmcaAction";
import CeaseDesistAction from "./pages/actions/CeaseDesistAction";
import ReportPlatformAction from "./pages/actions/ReportPlatformAction";
import RemovalAction from "./pages/actions/RemovalAction";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";
import ScanReports from "./pages/ScanReports";
import PublicVerifyImage from "./pages/PublicVerifyImage";
import SecureChecklist from "./pages/SecureChecklist";
import Enterprise from "./pages/Enterprise";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/enterprise" element={<Enterprise />} />
            <Route path="/performer/:slug" element={<PerformerProfile />} />
            <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><PerformerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/assets" element={<ProtectedRoute><MyAssets /></ProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/dashboard/certificate" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
            <Route path="/verify/:id" element={<PublicVerify />} />
            <Route path="/verify-image" element={<PublicVerifyImage />} />
            <Route path="/dashboard/secure-checklist" element={<ProtectedRoute><SecureChecklist /></ProtectedRoute>} />
            <Route path="/dashboard/verification" element={<ProtectedRoute><IdentityVerification /></ProtectedRoute>} />
            <Route path="/dashboard/review" element={<AdminRoute><AdminReviewQueue /></AdminRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/dashboard/legal" element={<AdminRoute><AdminLegalLogs /></AdminRoute>} />
            <Route path="/dashboard/blog" element={<AdminRoute><AdminBlog /></AdminRoute>} />
            <Route path="/dashboard/monitor" element={<ProtectedRoute><LikenessMonitor /></ProtectedRoute>} />
            <Route path="/dashboard/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
            <Route path="/dashboard/claim-scanner" element={<ProtectedRoute><ClaimScanner /></ProtectedRoute>} />
            <Route path="/dashboard/report" element={<ProtectedRoute><ProtectionReport /></ProtectedRoute>} />
            <Route path="/dashboard/violations" element={<ProtectedRoute><ReportViolation /></ProtectedRoute>} />
            <Route path="/dashboard/reports" element={<ProtectedRoute><ScanReports /></ProtectedRoute>} />
            <Route path="/education" element={<Education />} />
            <Route path="/education/:slug" element={<BlogPost />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/dashboard/take-action" element={<ProtectedRoute><TakeAction /></ProtectedRoute>} />
            <Route path="/tools/contracts" element={<ContractGenerator />} />
            <Route path="/tools/invoices" element={<InvoiceBuilder />} />
            <Route path="/tools/dmca" element={<DMCATakedown />} />
            <Route path="/tools/media-kit" element={<MediaKitBuilder />} />
            
            <Route path="/tools/face-claim" element={<FaceClaimWizard />} />
            <Route path="/tools/contract-checker" element={<ContractChecker />} />
            <Route path="/onboarding/why" element={<ProtectedRoute><OnboardingWhy /></ProtectedRoute>} />
            <Route path="/onboarding/profile" element={<ProtectedRoute><OnboardingProfile /></ProtectedRoute>} />
            <Route path="/onboarding/face-capture" element={<ProtectedRoute><OnboardingHeadshot /></ProtectedRoute>} />
            <Route path="/onboarding/headshot" element={<ProtectedRoute><OnboardingHeadshot /></ProtectedRoute>} />
            <Route path="/onboarding/voice" element={<ProtectedRoute><OnboardingVoice /></ProtectedRoute>} />
            <Route path="/onboarding/certified" element={<ProtectedRoute><OnboardingCertified /></ProtectedRoute>} />
            <Route path="/onboarding/monitoring" element={<ProtectedRoute><OnboardingMonitoring /></ProtectedRoute>} />
            <Route path="/onboarding/complete" element={<ProtectedRoute><OnboardingComplete /></ProtectedRoute>} />
            <Route path="/dashboard/profile" element={<ProtectedRoute><PerformerProfileTab /></ProtectedRoute>} />
            <Route path="/dashboard/trademark" element={<ProtectedRoute><TrademarkKit /></ProtectedRoute>} />
            <Route path="/dashboard/contract-scanner" element={<ProtectedRoute><ContractScannerPage /></ProtectedRoute>} />
            <Route path="/dashboard/evidence-packet" element={<ProtectedRoute><EvidencePacketPage /></ProtectedRoute>} />
            <Route path="/dashboard/identity-statement" element={<ProtectedRoute><IdentityStatementPage /></ProtectedRoute>} />
            <Route path="/dashboard/ai-rights" element={<ProtectedRoute><AIRightsPage /></ProtectedRoute>} />
            <Route path="/dashboard/incident-report" element={<ProtectedRoute><IncidentReportPage /></ProtectedRoute>} />
            <Route path="/dashboard/dmca" element={<ProtectedRoute><DmcaGeneratorPage /></ProtectedRoute>} />
            <Route path="/dashboard/emergency" element={<ProtectedRoute><EmergencyResponsePage /></ProtectedRoute>} />
            <Route path="/dashboard/action/dmca" element={<ProtectedRoute><DmcaAction /></ProtectedRoute>} />
            <Route path="/dashboard/action/cease-desist" element={<ProtectedRoute><CeaseDesistAction /></ProtectedRoute>} />
            <Route path="/dashboard/action/report" element={<ProtectedRoute><ReportPlatformAction /></ProtectedRoute>} />
            <Route path="/dashboard/action/removal" element={<ProtectedRoute><RemovalAction /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
