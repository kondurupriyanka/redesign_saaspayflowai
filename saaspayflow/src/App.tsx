import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index.tsx";
import ClientPortal from "./pages/ClientPortal.tsx";
import PublicInvoice from "./pages/PublicInvoice.tsx";
import NotFound from "./pages/NotFound.tsx";

import { AuthPage } from "./components/AuthPage.tsx";
import { AuthCallback } from "./pages/AuthCallback.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Clients } from "./pages/Clients.tsx";
import { ClientDetail } from "./pages/ClientDetail.tsx";
import Invoices from "./pages/Invoices.tsx";
import InvoiceDetail from "./pages/InvoiceDetail.tsx";
import NewInvoice from "./pages/NewInvoice.tsx";
import Reminders from "./pages/Reminders.tsx";
import { PrivacyPolicy } from "./pages/PrivacyPolicy.tsx";
import { Terms } from "./pages/Terms.tsx";
import { RefundPolicy } from "./pages/RefundPolicy.tsx";
import { Contact } from "./pages/Contact.tsx";
import ClientPortalResponse from "./pages/ClientPortalResponse.tsx";
import Payments from "./pages/Payments.tsx";
import Billing from "./pages/Billing.tsx";
import { AuthProvider, useAuth } from "./hooks/useAuth.tsx";
import { PaddleProvider } from "@/components/PaddleProvider";
import { Settings } from "./pages/Settings.tsx";
import { OnboardingFlow } from "./components/OnboardingFlow.tsx";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/**
 * Handles redirects after successful Supabase OAuth login
 * especially when redirected to the homepage (/) with tokens in the hash.
 */
const AuthRedirectHandler = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const hash = window.location.hash;
    const isPublicPage = ['/', '/auth', '/auth/callback'].includes(window.location.pathname);

    // 1. Detect session on page load if hash contains typical Supabase tokens
    if (hash.includes("access_token") || hash.includes("refresh_token")) {
      // Clean up and refresh to dashboard
      window.history.replaceState(null, "", "/dashboard");
      window.location.href = "/dashboard";
      return;
    }

    // 2. If session exists but we are on a landing/login page, move to dashboard
    if (session && isPublicPage) {
      window.location.href = "/dashboard";
    }

    // 3. Listen for auth state changes (requested by user)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const currentHash = window.location.hash;
        if (currentHash && currentHash.includes("access_token")) {
           window.history.replaceState(null, "", "/dashboard");
           window.location.href = "/dashboard";
        } else if (['/', '/auth', '/auth/callback'].includes(window.location.pathname)) {
          window.location.href = "/dashboard";
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [session, isLoading, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ErrorBoundary>
        <BrowserRouter>
          <PaddleProvider>
            <AuthProvider>
              <AuthRedirectHandler />
              <OnboardingFlow />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/refund" element={<RefundPolicy />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/portal/:token" element={<ClientPortal />} />
                <Route path="/invoice/:token" element={<PublicInvoice />} />
                <Route path="/portal/:id/response" element={<ClientPortalResponse />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
                <Route path="/clients/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
                <Route path="/invoices" element={<PrivateRoute><Invoices /></PrivateRoute>} />
                <Route path="/invoices/new" element={<PrivateRoute><NewInvoice /></PrivateRoute>} />
                <Route path="/invoices/:id" element={<PrivateRoute><InvoiceDetail /></PrivateRoute>} />
                <Route path="/payments" element={<PrivateRoute><Payments /></PrivateRoute>} />
                <Route path="/reminders" element={<PrivateRoute><Reminders /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />


                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </PaddleProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
