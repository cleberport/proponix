import AdminLayout from '@/components/admin/AdminLayout';
import AdminAutomations from '@/components/admin/AdminAutomations';

export default function AdminAutomationsPage() {
  return (
    <AdminLayout title="Automações" description="Regras de automação de email">
      <AdminAutomations />
    </AdminLayout>
  );
}
