import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PerformerDashboard from "./pages/PerformerDashboard";
import MyAssets from "./pages/MyAssets";
import Certificates from "./pages/Certificates";
import IdentityVerification from "./pages/IdentityVerification";
import AdminReviewQueue from "./pages/AdminReviewQueue";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import AdminLegalLogs from "./pages/AdminLegalLogs";
import AdminBlog from "./pages/AdminBlog";
import Education from "./pages/Education";
import BlogPost from "./pages/BlogPost";
import Tools from "./pages/Tools";
import LikenessMonitor from "./pages/LikenessMonitor";
import NotFound from "./pages/NotFound";

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
            <Route path="/dashboard" element={<ProtectedRoute><PerformerDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/assets" element={<ProtectedRoute><MyAssets /></ProtectedRoute>} />
            <Route path="/dashboard/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
            <Route path="/dashboard/verification" element={<ProtectedRoute><IdentityVerification /></ProtectedRoute>} />
            <Route path="/dashboard/review" element={<ProtectedRoute><AdminReviewQueue /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/dashboard/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
            <Route path="/dashboard/legal" element={<ProtectedRoute><AdminLegalLogs /></ProtectedRoute>} />
            <Route path="/dashboard/blog" element={<ProtectedRoute><AdminBlog /></ProtectedRoute>} />
            <Route path="/dashboard/monitor" element={<ProtectedRoute><LikenessMonitor /></ProtectedRoute>} />
            <Route path="/education" element={<Education />} />
            <Route path="/education/:slug" element={<BlogPost />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
