import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect, useState } from "react";
import {
  getSettings,
  getSavedTemplates,
  loadDocumentHistoryFromServer,
  loadSettingsFromServer,
  setAuthUserIdHint,
  clearAllUserCache,
} from "@/lib/templateStorage";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
const AppLayout = lazy(() => import("./components/AppLayout"));
const SubscriptionProviderLazy = lazy(() => import("./contexts/SubscriptionContext").then(m => ({ default: m.SubscriptionProvider })));

// Eagerly loaded (landing is the entry point)
import Landing from "./pages/Landing";

// Auth lazy-loaded since most visitors land on "/"
const Auth = lazy(() => import("./pages/Auth"));

// Lazy-loaded pages for code splitting
const Pricing = lazy(() => import("./pages/Pricing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Editor = lazy(() => import("./pages/Editor"));
const Generate = lazy(() => import("./pages/Generate"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Import = lazy(() => import("./pages/Import"));
const Emails = lazy(() => import("./pages/Emails"));
const Admin = lazy(() => import("./pages/Admin"));
const Billing = lazy(() => import("./pages/Billing"));
const ProposalView = lazy(() => import("./pages/ProposalView"));
const Recebidos = lazy(() => import("./pages/Recebidos"));
const Financas = lazy(() => import("./pages/Financas"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

const ThemeInit = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const settings = getSettings();
    if (settings.theme === 'light') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return <>{children}</>;
};

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const DefaultTemplateRedirect = () => {
  const settings = getSettings();
  if (settings.defaultTemplateId) {
    return <Navigate to={`/generate/${settings.defaultTemplateId}`} replace />;
  }
  return <Dashboard />;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let previousUserId: string | null = null;
    let initialResolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      const nextUserId = nextSession?.user?.id ?? null;
      // Clear ALL cached data when user signs out or switches account
      if (initialResolved && nextUserId !== previousUserId) {
        clearAllUserCache();
      }
      previousUserId = nextUserId;
      setSession(nextSession);
      setAuthUserIdHint(nextUserId);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      const initialUserId = initialSession?.user?.id ?? null;
      // On first load, clear cache if no session (prevents stale data from previous user)
      if (!initialUserId) {
        clearAllUserCache();
      }
      previousUserId = initialUserId;
      initialResolved = true;
      setSession(initialSession);
      setAuthUserIdHint(initialUserId);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    void Promise.allSettled([
      loadSettingsFromServer().then(() => {
        const s = getSettings();
        document.documentElement.classList.toggle('dark', s.theme === 'light');
      }),
      getSavedTemplates(),
      loadDocumentHistoryFromServer(),
    ]);
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SubscriptionProviderLazy>
            <ThemeInit>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public */}
                  <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Landing />} />
                  <Route path="/auth" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
                  <Route path="/p/:token" element={<ProposalView />} />
                  <Route path="/pricing" element={<Pricing />} />

                  {/* Protected */}
                  <Route path="/dashboard" element={<ProtectedRoute session={session}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                  <Route path="/quick" element={<ProtectedRoute session={session}><DefaultTemplateRedirect /></ProtectedRoute>} />
                  <Route path="/templates" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/documents" element={<ProtectedRoute session={session}><AppLayout><Documents /></AppLayout></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute session={session}><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute session={session}><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
                  <Route path="/emails" element={<ProtectedRoute session={session}><Navigate to="/admin" replace /></ProtectedRoute>} />
                  <Route path="/import" element={<ProtectedRoute session={session}><AppLayout><Import /></AppLayout></ProtectedRoute>} />
                  <Route path="/recebidos" element={<ProtectedRoute session={session}><AppLayout><Recebidos /></AppLayout></ProtectedRoute>} />
                  <Route path="/financas" element={<ProtectedRoute session={session}><AppLayout><Financas /></AppLayout></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute session={session}><AppLayout><Admin /></AppLayout></ProtectedRoute>} />
                  <Route path="/billing" element={<ProtectedRoute session={session}><Navigate to="/settings?tab=billing" replace /></ProtectedRoute>} />
                  <Route path="/editor/:id" element={<ProtectedRoute session={session}><Editor /></ProtectedRoute>} />
                  <Route path="/generate/:id" element={<ProtectedRoute session={session}><Generate /></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ThemeInit>
          </SubscriptionProviderLazy>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
