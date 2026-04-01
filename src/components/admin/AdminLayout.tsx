import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminMobileNav from './AdminMobileNav';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { isAdmin, loading } = useAdminCheck();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminMobileNav />
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
