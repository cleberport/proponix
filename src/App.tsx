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
} from "@/lib/templateStorage";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AppLayout from "./components/AppLayout";

// Eagerly loaded (landing + auth are entry points)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";

// Lazy-loaded pages for code splitting
const Pricing = lazy(() => import("./pages/Pricing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Documents = lazy(() => import("./pages/Documents"));
const Profile = lazy(() => import("./pages/Profile"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const Editor = lazy(() => import("./pages/Editor"));
const Generate = lazy(() => import("./pages/Generate"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const queryClient = new QueryClient();

const ThemeInit = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const settings = getSettings();
    if (settings.theme === 'dark') {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setAuthUserIdHint(nextSession?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
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
      loadSettingsFromServer(),
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
          <ThemeInit>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <Landing />} />
                <Route path="/auth" element={session ? <Navigate to="/dashboard" replace /> : <Auth />} />
                <Route path="/pricing" element={<Pricing />} />

                {/* Protected */}
                <Route path="/dashboard" element={<ProtectedRoute session={session}><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
                <Route path="/quick" element={<ProtectedRoute session={session}><DefaultTemplateRedirect /></ProtectedRoute>} />
                <Route path="/templates" element={<Navigate to="/dashboard" replace />} />
                <Route path="/documents" element={<ProtectedRoute session={session}><AppLayout><Documents /></AppLayout></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute session={session}><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute session={session}><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
                <Route path="/editor/:id" element={<ProtectedRoute session={session}><Editor /></ProtectedRoute>} />
                <Route path="/generate/:id" element={<ProtectedRoute session={session}><Generate /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ThemeInit>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
