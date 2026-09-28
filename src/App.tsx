import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPartners from "./pages/admin/Partners";
import AdminPartnerDetail from "./pages/admin/PartnerDetail";
import AdminPartnerNew from "./pages/admin/PartnerNew";
import AdminUsers from "./pages/admin/Users";
import AdminUserDetail from "./pages/admin/UserDetail";
import AdminUserNew from "./pages/admin/UserNew";
import AdminLeads from "./pages/admin/Leads";
import AdminLeadNew from "./pages/admin/LeadNew";
import AdminLeadDetail from "./pages/admin/LeadDetail";
import AdminDeals from "./pages/admin/Deals";
import AdminDealDetail from "./pages/admin/DealDetail";
import AdminDealNew from "./pages/admin/DealNew";
import DealEditPage from "./pages/deals/DealEditPage";
import DealViewPage from "./pages/deals/DealViewPage";
import AdminReporting from "./pages/admin/Reporting";
import AdminConfigure from "./pages/admin/Configure";
import AdminDocuments from "./pages/admin/Documents";
import AdminDocumentUpload from "./pages/admin/DocumentUpload";

// Partner pages
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerLeads from "./pages/partner/Leads";
import PartnerLeadNew from "./pages/partner/LeadNew";
import PartnerLeadDetail from "./pages/partner/LeadDetail";
import PartnerDeals from "./pages/partner/Deals";
import PartnerDealNew from "./pages/partner/DealNew";
import PartnerDealDetail from "./pages/partner/DealDetail";
import PartnerDocuments from "./pages/partner/Documents";
import PartnerFinance from "./pages/partner/Finance";
import PartnerSettings from "./pages/partner/Settings";

const queryClient = new QueryClient();

function ProtectedRoute({ allowedRole }: { allowedRole?: "admin" | "partner" }) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to={role === "admin" ? "/app/admin/dashboard" : "/app/partner/dashboard"} replace />;
  }

  return <Outlet />;
}

function RoleLandingRedirect() {
  const { role } = useAuth();
  return <Navigate to={role === "admin" ? "/app/admin/dashboard" : "/app/partner/dashboard"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/app" element={<ProtectedRoute />}>
              <Route index element={<RoleLandingRedirect />} />
            </Route>

            {/* Admin routes */}
            <Route path="/app/admin" element={<ProtectedRoute allowedRole="admin" />}>
              <Route element={<AppShell />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="partners/new" element={<AdminPartnerNew />} />
              <Route path="partners/:partnerId" element={<AdminPartnerDetail />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/new" element={<AdminUserNew />} />
              <Route path="users/:userId" element={<AdminUserDetail />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="leads/new" element={<AdminLeadNew />} />
              <Route path="leads/:leadId" element={<AdminLeadDetail />} />
              <Route path="deals" element={<AdminDeals />} />
              <Route path="deals/new" element={<AdminDealNew />} />
              <Route path="deals/:id/edit" element={<DealEditPage role="admin" />} />
              <Route path="deals/:id/view" element={<DealViewPage role="admin" />} />
              <Route path="deals/:id" element={<AdminDealDetail />} />
              <Route path="reporting" element={<AdminReporting />} />
              <Route path="configure" element={<AdminConfigure />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="documents/upload" element={<AdminDocumentUpload />} />
              </Route>
            </Route>

            {/* Partner routes */}
            <Route path="/app/partner" element={<ProtectedRoute allowedRole="partner" />}>
              <Route element={<AppShell />}>
              <Route path="dashboard" element={<PartnerDashboard />} />
              <Route path="leads" element={<PartnerLeads />} />
              <Route path="leads/new" element={<PartnerLeadNew />} />
              <Route path="leads/:leadId" element={<PartnerLeadDetail />} />
              <Route path="deals" element={<PartnerDeals />} />
              <Route path="deals/new" element={<PartnerDealNew />} />
              <Route path="deals/:id/edit" element={<DealEditPage role="partner" />} />
              <Route path="deals/:id/view" element={<DealViewPage role="partner" />} />
              <Route path="deals/:id" element={<PartnerDealDetail />} />
              <Route path="finance" element={<PartnerFinance />} />
              <Route path="documents" element={<PartnerDocuments />} />
              <Route path="settings" element={<PartnerSettings />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
