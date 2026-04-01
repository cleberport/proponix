import AdminLayout from '@/components/admin/AdminLayout';
import AdminEmailsSection from '@/components/admin/AdminEmailsSection';

export default function AdminTemplates() {
  return (
    <AdminLayout title="Templates de Email" description="Gerencie templates de email transacionais">
      <AdminEmailsSection />
    </AdminLayout>
  );
}
