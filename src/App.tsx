import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useAuth } from "@/lib/auth-context";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

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
                <Route path="dashboard" element={<PageSkeleton title="Dashboard" description="Admin overview placeholder" />} />
                <Route path="partners" element={<PageSkeleton title="Partners" />} />
                <Route path="leads" element={<PageSkeleton title="Leads" />} />
                <Route path="deals" element={<PageSkeleton title="Deals" />} />
                <Route path="documents" element={<PageSkeleton title="Content Hub" />} />
                <Route path="reporting" element={<PageSkeleton title="Reporting" />} />
                <Route path="configure" element={<PageSkeleton title="Configure" />} />
                <Route path="users" element={<PageSkeleton title="Users" />} />
              </Route>
            </Route>

            {/* Partner routes */}
            <Route path="/app/partner" element={<ProtectedRoute allowedRole="partner" />}>
              <Route element={<AppShell />}>
                <Route path="dashboard" element={<PageSkeleton title="Dashboard" description="Partner portal overview placeholder" />} />
                <Route path="leads" element={<PageSkeleton title="Leads" />} />
                <Route path="deals" element={<PageSkeleton title="Deals" />} />
                <Route path="finance" element={<PageSkeleton title="Finance" />} />
                <Route path="documents" element={<PageSkeleton title="Content Hub" />} />
                <Route path="settings" element={<PageSkeleton title="Settings" />} />
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
