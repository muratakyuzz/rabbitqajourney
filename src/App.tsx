import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { RqProvider } from "@/lib/rabbitqa/store";
import { AppShell } from "@/components/AppShell";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import MyWork from "./pages/MyWork";
import CustomerReport from "./pages/CustomerReport";
import ManagementReport from "./pages/ManagementReport";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Oturum yükleniyor...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RqProvider>
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
                <Route element={<AppShell />}>
                  <Route index element={<Navigate to="/app/projects" replace />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="projects/:id" element={<ProjectDetail />} />
                  <Route path="my-work" element={<MyWork />} />
                  <Route path="projects/:id/report" element={<CustomerReport />} />
                  <Route path="reports" element={<ManagementReport />} />
                  <Route path="admin" element={<Admin />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RqProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
