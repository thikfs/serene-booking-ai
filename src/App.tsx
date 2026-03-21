import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./layouts/AdminLayout";
import AdminOverview from "./pages/admin/Overview";
import ServiceManager from "./pages/admin/ServiceManager";
import AgentSettings from "./pages/admin/AgentSettings";
import AppointmentCalendar from "./pages/admin/AppointmentCalendar";
import PlaceholderText from "./pages/PlaceholderText";
import Login from "./pages/Login";
import { AuthProvider } from "@/lib/auth";
import { RequireAuth } from "@/components/RequireAuth";

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
            <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="services" element={<ServiceManager />} />
              <Route path="agent" element={<AgentSettings />} />
              <Route path="appointments" element={<AppointmentCalendar />} />
            </Route>
            <Route path="/ai-booking-2026.txt" element={<PlaceholderText />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
