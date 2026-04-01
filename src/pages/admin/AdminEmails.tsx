import AdminLayout from '@/components/admin/AdminLayout';
import AdminEmailsSection from '@/components/admin/AdminEmailsSection';

export default function AdminEmails() {
  return (
    <AdminLayout title="Emails" description="Gerencie templates de email">
      <AdminEmailsSection />
    </AdminLayout>
  );
}
