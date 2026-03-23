import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Satisfaction from "./pages/Satisfaction";
import MarketingDashboard from "./pages/MarketingDashboard";
import TrackingRedirect from "./pages/TrackingRedirect";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredPath="/dashboard">
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/satisfaction"
                element={
                  <ProtectedRoute requiredPath="/satisfaction">
                    <Satisfaction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/media-commerce/marketing"
                element={
                  <ProtectedRoute requiredPath="/media-commerce/marketing">
                    <MarketingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/r/:code" element={<TrackingRedirect />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
