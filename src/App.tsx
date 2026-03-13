import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { getSettings } from "@/lib/templateStorage";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Templates from "./pages/Templates";
import Documents from "./pages/Documents";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import Editor from "./pages/Editor";
import Generate from "./pages/Generate";
import NotFound from "./pages/NotFound";

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

const DefaultTemplateRedirect = () => {
  const settings = getSettings();
  if (settings.defaultTemplateId) {
    return <Navigate to={`/generate/${settings.defaultTemplateId}`} replace />;
  }
  return <Dashboard />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeInit>
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/quick" element={<DefaultTemplateRedirect />} />
            <Route path="/templates" element={<AppLayout><Templates /></AppLayout>} />
            <Route path="/documents" element={<AppLayout><Documents /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
            <Route path="/editor/:id" element={<Editor />} />
            <Route path="/generate/:id" element={<Generate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ThemeInit>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
