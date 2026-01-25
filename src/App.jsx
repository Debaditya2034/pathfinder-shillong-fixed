import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { LanguageProvider } from "@/lib/i18n";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Itinerary from "./pages/Itinerary";
import BookingConfirm from "./pages/BookingConfirm";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RideBoard from "./pages/RideBoard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/about" element={<About />} />
              <Route
                path="/itinerary"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <Itinerary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking-confirm"
                element={
                  <ProtectedRoute requireAuth={true}>
                    <BookingConfirm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver"
                element={
                  <ProtectedRoute allowedRoles={["driver"]} requireAuth={true}>
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]} requireAuth={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/rides" element={<RideBoard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ErrorBoundary>
);

export default App;
