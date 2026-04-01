import AdminLayout from '@/components/admin/AdminLayout';
import AdminEmailLogs from '@/components/admin/AdminEmailLogs';

export default function AdminEmailLogsPage() {
  return (
    <AdminLayout title="Email Logs" description="Histórico de envio de emails">
      <AdminEmailLogs />
    </AdminLayout>
  );
}
