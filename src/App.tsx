import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="services" element={<ServiceManager />} />
            <Route path="agent" element={<AgentSettings />} />
            <Route path="appointments" element={<AppointmentCalendar />} />
          </Route>
          <Route path="/ai-booking-2026.txt" element={<PlaceholderText />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
